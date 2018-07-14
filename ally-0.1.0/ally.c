/*
 * Copyright (c) 2002
 * Neil Spring and the University of Washington.
 * All rights reserved. 
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author(s) may not be used to endorse or promote
 *    products derived from this software without specific prior
 *    written permission.  
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR(S) ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR(S) BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*  TODO: add a per- ally_do() invocation sequence number offset
    so that unrelated tests don't get delayed in the network and
    confuse us */
#include <string.h>
#include <stdlib.h>		/* For atof(), etc. */
#include <errno.h>
#include <unistd.h>		/* For getpid(), etc. */

#include <sys/types.h>
#include <sys/time.h>
#include <netinet/in.h>
#include <netinet/in_systm.h> /* needed before include of ip.h */

#include <sys/socket.h>
#include <sys/file.h>
#include <sys/ioctl.h>

#define __FAVOR_BSD
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netinet/ip.h>
#include <netinet/ip_icmp.h>
#include <netinet/udp.h>
#include <netdb.h>
#include <ctype.h>
#include <stdio.h>
#include <float.h>
#include <assert.h>
#include "nscommon.h"

#include "ally.h"

/* true globals. */
int rcvsock;			/* receive (icmp) socket file descriptor */
int sndsock;			/* send (udp) socket file descriptor */
static struct timeval tv_start;
boolean rechecking;

/* ally builds an array of these structures, which represent
   the useful bits of the responses.  */
/* odd ones for the odd (second) router, even ones for the 
   first */ 
struct rtr_signature_struct {
  struct in_addr resp_addr; /* source address of the response */
  struct in_addr quer_addr; /* destination address of the request */
  unsigned short ip_id; /* IP ID of the response */
  unsigned char ttl_out; /* ttl of the request when it got there */
  unsigned char ttl_in; /* ttl of the response when we received it */
  double order;  /* when (in ms since tv_start) the response was received */
};

/* compare two IP ID's considering wraparound. 
   essentially stolen from kernel source */
static inline boolean before(unsigned short seq1, unsigned short seq2) {
  return ((signed short)(seq1-seq2) < 0);
}     

/* helper for formatting the text representation of ally's results */
static void tristate(const char *str, int value) {
  if(value < 0)  printf("!");
  if(value != 0) printf("%s", str);
}

/* format ally's results for insertion into the rocketfuel database */
void ally_db_insert_string(char *buf, 
                           struct status *status) {
  int firstbytes = 
    sprintf(buf, "(ip1, ip2, ipid, return_ttl, out_ttl, same_ip, "
            "b_returns_a, a_returns_b, cisco) "
            "values ('%s', ", inet_ntoa(status->a));
  sprintf(buf + firstbytes, 
          "'%s', %d, %d, %d, %d, %d, %d, %d)", inet_ntoa(status->b),
         status->ipid, status->return_ttl, status->out_ttl, 
         status->same_ip, status->b_returns_a, status->a_returns_b,
         status->cisco);
}

/* print the text or database version of the results */
void ally_print_status(struct status *status, 
                  boolean database_output) {
  if(database_output) {
    char buf[1024];
    ally_db_insert_string(buf, status);
    printf("%s\n", buf);
  } else {
    printf("ip1=%s ", inet_ntoa(status->a));
    printf("ip2=%s ", inet_ntoa(status->b));
    tristate("ipid ", status->ipid);
    tristate("return_ttl ", status->return_ttl);
    tristate("out_ttl ", status->out_ttl);
    tristate("same_ip ", status->same_ip);
    tristate("b_returns_a ", status->b_returns_a);
    tristate("a_returns_b ", status->a_returns_b);
    tristate("cisco", status->cisco);
    printf("\n");
  }
}

/* how to decide if they're aliases if we only heard from
   one of the IP addresses: here, only if the one we heard
   from returned the address of the one that didn't. */
static void single(struct rtr_signature_struct *first, 
            struct rtr_signature_struct *second, 
            struct in_addr other_asked,
            struct status *status,
            boolean odd) {
  int value = 
    (other_asked.s_addr == first->resp_addr.s_addr  ||
     other_asked.s_addr == second->resp_addr.s_addr) ? 1 : -1;
  if(odd) {
    status->b_returns_a = value;
  } else {
    status->a_returns_b = value;
  }
}

/* how to decide if they're aliases when we heard from
   both of them */
static void compare(struct rtr_signature_struct *squak_a, 
             struct rtr_signature_struct *squak_b, 
             struct status *status,
             boolean consecutive) {
  int reorder_delta = 1;
  int separat_delta = 1000;
  struct rtr_signature_struct * earlier, *later;

  if(squak_a->order < squak_b->order) {
    earlier = squak_a; later = squak_b;
  } else {
    earlier = squak_b; later = squak_a;
  }

  if(consecutive) {
    /* we sent the outgoing ones very closely spaced, 
       reduce the tolerance */
    reorder_delta = 10;
    separat_delta = 200;
  }
  if(rechecking) {
    /* be a little more liberal when verifying already
       discovered aliases. we don't want to lose any. */
    reorder_delta *= 10;
    separat_delta *= 10;
  }
  if(squak_a->order < FLT_EPSILON || squak_b->order < FLT_EPSILON ) {
    return;
  }
  status->a_return_ttl = squak_a->ttl_in;
  status->b_return_ttl = squak_b->ttl_in;
  /* good result, but likely shows that the two aren't aliases */
  status->return_ttl = 
    (squak_a->ttl_in == squak_b->ttl_in) ? 1 : -1;
  /* not such a great indicator */
  status->out_ttl = 
    (squak_a->ttl_out == squak_b->ttl_out) ? 1 : -1;

  status->ipid = 
     before(earlier->ip_id - reorder_delta, later->ip_id) && 
     before(later->ip_id, earlier->ip_id + separat_delta) &&
     (earlier->ip_id != later->ip_id) ? 
    1 : -1;

  status->same_ip = 
    (squak_a->resp_addr.s_addr == squak_b->resp_addr.s_addr) ? 1 : -1;
  status->b_returns_a = 
    (squak_a->quer_addr.s_addr == squak_b->resp_addr.s_addr) ? 1 : -1;
  status->a_returns_b = 
    (squak_b->quer_addr.s_addr == squak_a->resp_addr.s_addr) ? 1 : -1;
}

/* initialize: we need both a raw socket for sending ICMP
   traffic, and a raw socket for receiving responses */
static boolean 
get_sockets(void)
{
  struct protoent *pe;
  const char *terminator = "\n";

  if ((pe = getprotobyname("icmp")) == NULL) {
    fprintf(stderr, "icmp: unknown protocol%s", terminator);
    return(FALSE);
  }
  if ((rcvsock = socket(AF_INET, SOCK_RAW, pe->p_proto)) < 0) {
    perror("ally: icmp socket");
    return(FALSE);
  }
  if ((sndsock = socket(AF_INET, SOCK_RAW, IPPROTO_RAW)) < 0) {
    perror("ally: raw socket");
    return(FALSE);
  }
  return(TRUE);
}

static u_short port = 32768+666;	/* start udp dest port # for probe packets */

/* format of a (udp) probe packet. */
struct opacket {
  struct ip ip;
  struct udphdr udp;
  u_char seq;		/* sequence number of this packet */
  u_char ttl;		/* ttl packet left with */
  struct timeval tv;	/* time packet left */
};

/* shared between send_it and reap */
static unsigned short ident;

static void send_it(struct in_addr dst, int seq) {
  struct opacket op;
  struct ip *ip = &op.ip;
  struct udphdr *up = &op.udp;
  struct sockaddr_in to;
  unsigned short datalen = 40;
  int r;

  if(ident == 0) {
    /* cut down on how often we have to ask the kernel for anything */
    ident = (getpid() & 0xffff) | 0x8000;
  }

  to.sin_addr = dst;
  to.sin_family = AF_INET;
  ip->ip_p = IPPROTO_UDP;
  ip->ip_len = ntohs(datalen);
  ip->ip_ttl = 60;
  ip->ip_v = 4;
  ip->ip_tos = 0;
  ip->ip_off = 0;
  ip->ip_id = 0;
  ip->ip_src.s_addr = 0;
  ip->ip_dst.s_addr = to.sin_addr.s_addr;
  ip->ip_hl = sizeof(*ip) >> 2;

  up->uh_sport = htons(ident);
  up->uh_dport = htons(port+seq);
  up->uh_ulen = htons(datalen - sizeof(struct ip));
  up->uh_sum = 0;

  op.seq = seq;
  op.ttl = 60;

  r = sendto(sndsock, (char *)&op, datalen, 0, (struct sockaddr *)&to,
             sizeof(struct sockaddr));
  if(r<0) perror("sendto");

}

static int
wait_for_reply(int sock, struct timeval *deadline, 
               unsigned char *packet_buf, size_t packet_buf_len )
{
  fd_set fds;
  struct timeval now, wait;
  int cc = 0;

  gettimeofday(&now, NULL);
  if ((now.tv_sec > deadline->tv_sec) ||
      ( (now.tv_sec == deadline->tv_sec) && 
        (now.tv_usec > deadline->tv_usec) )  ) return (int)NULL;


  wait.tv_sec= deadline->tv_sec- now.tv_sec;
  if (deadline->tv_usec >= now.tv_usec) {
    wait.tv_usec= deadline->tv_usec- now.tv_usec;
  } else {
    wait.tv_usec= (1000000 - now.tv_usec)+ deadline->tv_usec;
    wait.tv_sec--;
  }

  FD_ZERO(&fds);
  FD_SET(sock, &fds);

  if (select(sock+1, &fds, (fd_set *)0, (fd_set *)0, &wait) > 0)
    cc=recvfrom(rcvsock, packet_buf, packet_buf_len, 0, NULL, NULL);
  return((int)cc);
}

static int reap(u_char *pbuf, int len, 
                struct rtr_signature_struct *squak) {
  struct ip *ip = (struct ip *)pbuf;
  struct icmp *icp;
  struct ip *encap_ip;
  struct udphdr *encap_up;
  if(ident == 0) {
    printf ("send_it before you reap, yo'\n");
    return(0);
  }
  if(ip->ip_v != 4) {
    printf ("jus kno proto vee fo'\n");
    return(0);
  }
  if(len < (ip->ip_hl<<2)) {
    printf ("I wish I was a little bit taller\n");
    return(0);
  }
  icp = (struct icmp *) ((u_char *)pbuf+(ip->ip_hl<<2));
  /* figure out if it was for us first */
  encap_ip = &icp->icmp_ip;
  encap_up = (struct udphdr *) ((u_char *)encap_ip + (encap_ip->ip_hl<<2));
  if(encap_up->uh_sport == htons(ident)) {
    int seq = ntohs(encap_up->uh_dport) - port;
    u_short type = icp->icmp_type; 
    if(type == ICMP_UNREACH) {
      u_short code = icp->icmp_code;
      if(code != 3) {
        fprintf(stderr, "warning: not port unreachable: ");
        switch(code) {
        case 0: /* network */
          fprintf(stderr, "!N");
          break;
        case 1: /* host */
          fprintf(stderr, "!H");
          break;
        case 2: /* proto */
          fprintf(stderr, "!P");
          break;
        case 13: /* bitches */
          fprintf(stderr, "!Filtered");
          break;
        default:
          fprintf(stderr, "%d?", code);
          break;
        }
        fprintf(stderr, "... ignoring: ");
        fprintf(stderr, "%d: from %s: id %u, ttl %u/%u\n", 
               ntohs(encap_up->uh_dport) - port,
               inet_ntoa(ip->ip_src),
               ntohs(ip->ip_id),
               encap_ip->ip_ttl, ip->ip_ttl);
        return(0);
      }
      
      if(seq >= 0 && seq <= 10) {
        struct timeval tv;
        struct timeval time_since_start;
        printf( "%d: from %s: id %u, ttl %u/%u\n", 
               ntohs(encap_up->uh_dport) - port,
               inet_ntoa(ip->ip_src),
               ntohs(ip->ip_id),
               encap_ip->ip_ttl, ip->ip_ttl);
        squak[seq] . resp_addr = ip->ip_src;
        squak[seq] . quer_addr = encap_ip->ip_dst;
        squak[seq] . ip_id = ntohs(ip->ip_id);
        squak[seq] . ttl_out = encap_ip->ip_ttl;
        squak[seq] . ttl_in = ip->ip_ttl;
        gettimeofday(&tv, NULL);
        timersub(&tv, &tv_start, &time_since_start);
        squak[seq] . order = (double)time_since_start.tv_sec 
                 + (double)time_since_start.tv_usec/1000000.0;
      }
      return(1);
    }
  } else {
    /* u_short type = icp->icmp_type; 
       u_short code = icp->icmp_code;
       if(type!=11)  ttl - exceeded */
    /* fprintf(stderr, "unrelated ICMP received: type %d, code %d\n", type, code);*/
  }
  return(0);
}

boolean ally_init(void) {
  gettimeofday(&tv_start, NULL);
  assert(before(0xffff, 1));
  assert(before(1, 2));
  assert(before(32000, 33000));
  return(get_sockets());
}

void ally_do(struct status *status) {
  struct timeval deadline_tv;
  struct rtr_signature_struct squak[11];
  int len, received = 0;
  unsigned char packet[512];		/* last inbound (icmp) packet */

  memset(squak, 0, sizeof(squak));
  send_it(status->a, 0);
  usleep(10); /* sleep (at least) 10 micro seconds, to spread for cisco */
  send_it(status->b, 1);
  gettimeofday(&deadline_tv, NULL);
  deadline_tv.tv_sec += 5;
  while(received < 2 && (len = wait_for_reply(rcvsock, &deadline_tv, packet, 512))) {
    received += reap(packet, len, squak);
  }
  if(received == 2) {
    status->cisco = -1;
    status->a_responded = TRUE;
    status->b_responded = TRUE;
    compare(&squak[0], &squak[1], status, TRUE);
    /* if we got both responses, and ipid passed, try to tighten the bound */
    if(status->ipid==1) {
      received = 0;
      sleep(1);
      gettimeofday(&deadline_tv, NULL);
      deadline_tv.tv_sec += 5;
      /* send again to the one that responded first */
      if(squak[0].order<squak[1].order) {
        send_it(status->a, 2);
      } else {
        send_it(status->b, 3);
      }
      /* reap the response */
      while(received < 1 && 
            (len = wait_for_reply(rcvsock, &deadline_tv, packet, 512))) {
        received += reap(packet, len, squak);
      }
      /* if it's ip_id is still lower than the last one to respond before,
         revert to ipid failure */
      if(squak[0].order<squak[1].order) {
        if(before(squak[2].ip_id,squak[1].ip_id)) {
          status->ipid = -1;
        }
      } else {
        if(before(squak[3].ip_id, squak[0].ip_id)) {
          status->ipid = -1;
        }
      }
    }
  } else if(received == 1) {
    /* fprintf(stderr, "crap, only got one reply, trying alternate\n"); */
    send_it(status->b, 3);  /* reorder to try to get the other one. */
    usleep(10);
    send_it(status->a, 2);
    gettimeofday(&deadline_tv, NULL);
    deadline_tv.tv_sec += 5;
    received = 0;
    while(received < 2 
          && (len = wait_for_reply(rcvsock, &deadline_tv, packet, 512))) {
      received += reap(packet, len, squak);
    }
    if(received == 2) {
      status->cisco = -1;
      compare(&squak[2],&squak[3], status, TRUE);
      status->a_responded = TRUE;
      status->b_responded = TRUE;
    } else if (received==1) {
      if(squak[0].order > DBL_EPSILON && squak[2].order> DBL_EPSILON ) {
        single(&squak[0], &squak[2], status->b, status, FALSE);
        status->a_responded = TRUE;
      } else if(squak[1].order > DBL_EPSILON && squak[3].order> DBL_EPSILON ) {
        single(&squak[1], &squak[3], status->a, status, TRUE);
        status->b_responded = TRUE;
      } else if(squak[1].order > DBL_EPSILON && squak[2].order> DBL_EPSILON ) {
        status->cisco = 1;
        compare(&squak[2],&squak[1], status, FALSE);
        status->a_responded = TRUE;
        status->b_responded = TRUE;
      } else if(squak[0].order > DBL_EPSILON && squak[3].order> DBL_EPSILON ) {
        status->cisco = 1;
        compare(&squak[0],&squak[3], status, FALSE);
        status->a_responded = TRUE;
        status->b_responded = TRUE;
      }
    } 
  } else {
    /* fprintf(stderr, "timed out\n"); */
  }
}

