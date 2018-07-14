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

#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include "nscommon.h"
#include "string_bindings.h"
#include "link_matrix.h"
#include "typed_hashtable.h"
#include "sorted_intlist.h"
#include "commandline.h"
#include "libpq-fe.h"
#include "postgresql.h"
#include "progress.h"
#include "alias_matrix.h"

#define NEIGHBUFSZ 512

/*  should  consider  external  links  */

struct node {
  unsigned short location;
  unsigned short bAuthoritative:1,
    bTop:1,
    bNotBottom:1,
    bResponsive:1,
    bBackbone:1;
  char *name;
  sorted_intlist si_external;
};

struct node *nodes; /* array */

struct uidip {
  unsigned int ip;
  unsigned short uid;
};

unsigned int hash_uidip(const struct uidip *a) {
  return(a->ip);
}
boolean isequal_uidip(const struct uidip *a, const struct uidip *b) {
  return(a->ip == b->ip);
}
void dump_poptable(PGconn *conn);

/* worry about local aliases; for external aliases, we're sol */
static void external_link(unsigned short uid, 
                   unsigned int addr) {
  sorted_intlist si;
  if(nodes[uid].si_external==NULL) {
    nodes[uid].si_external = si_new();
  }
  si = nodes[uid].si_external;
  if(!si_member(si, addr)) {
    si_insert(si,addr);
  }
}

DECLARE_TYPED_HASHTABLE(struct uidip, uidip);

uidip_hashtable uid_for_ip;
unsigned short uid_for_ip_fn(const char *ipaddr) {
  struct uidip findme, *found;
  findme.ip = inet_addr(ipaddr); 
  found = uidip_ht_lookup(uid_for_ip, &findme);
  if(found == NULL) {
    // common, because of egress things... 
    //fprintf(stderr, "failed lookup for %s\n", ipaddr);
    return(-1);
  } else {
    return(found->uid);
  }
}


struct uidip *uidips; /* array, from which the others are sequentially recovered */
unsigned short num_ips, num_nodes, num_links, num_top, num_question;

string_bindings sb_locations;
link_matrix lm;

void load_uids(PGconn *conn) {
  char querybuf[256];
  int i;
  PGresult   *res;
  progress_label("ips");
  sprintf(querybuf, "select ip, uid from aliases%u order by uid", target_asn);
  res = PQexec(conn, querybuf);
  if (PQresultStatus(res) != PGRES_TUPLES_OK) {
    fprintf(stderr, "select aliases table from db failed for AS-%u\n",target_asn);
    fprintf(stderr, "res->status = %s\n", PQresStatus(PQresultStatus(res))); 
    
    PQclear(res);
    PQfinish(conn);
    exit(EXIT_FAILURE);
  }

  num_ips = PQntuples(res);

  /* access by ip */
  uid_for_ip = uidip_ht_new(num_ips, hash_uidip, isequal_uidip, 
                            (uidip_ht_delete_cb)free);
  /* access by not uid... cuz there might be a lot */
  uidips = malloc(sizeof(struct uidip) * num_ips);
    
  progress_n_of(0, num_ips);
  /* next, print out the instances */
  for (i = 0; i < num_ips; i++) {
    char *ip_str = PQgetvalue(res,i,0);
    char *uid_str = PQgetvalue(res,i,1);
    if(uid_str != NULL && ip_str != NULL) {
      uidips[i].uid = atoi(uid_str);
      uidips[i].ip = inet_addr(ip_str);
      uidip_ht_insert(uid_for_ip, &uidips[i]);
      num_nodes = max(num_nodes, 
                      (unsigned short)(1+uidips[i].uid));
    } else {
      fprintf(stderr, "bad table somehow\n");
    }
    if(i%1000 == 0) {
      progress_n_of(i, num_ips);
    }
  }
  progress_n_of(num_ips, num_ips);
  PQclear(res);
}

static void load_responsive(PGconn *conn) {
  char querybuf[256];
  int i;
  PGresult   *res;
  int num_responsive; /* acutally an underestimate */

  progress_label("responsive");
  /* now, flag those that have been responsive. */
  sprintf(querybuf, "select distinct ip1 from ally%u", target_asn);
  res = PQexec(conn, querybuf);
  if (PQresultStatus(res) != PGRES_TUPLES_OK) {
    fprintf(stderr, "select responsive from db failed\n");
    fprintf(stderr, "res->status = %s\n", PQresStatus(PQresultStatus(res))); 
    
    PQclear(res);
    PQfinish(conn);
    exit(EXIT_FAILURE);
  }
  num_responsive = PQntuples(res);
  progress_n_of(0, num_responsive);
  /* next, print out the instances */
  for (i = 0; i < num_responsive; i++) {
    char *ip1_str = PQgetvalue(res,i,0);
    unsigned short uid = uid_for_ip_fn(ip1_str);
    if((short)uid!=-1)
      nodes[uid].bResponsive = TRUE;
    else {
      /* this can happen if we're studying ips from outside
         our maps */
      /* fprintf(stderr, "warn - don't know %s\n", ip1_str); */
    }
    if(i%1000 == 0) {
      progress_n_of(i, num_ips);
    }
  }
  progress_n_of(num_responsive, num_responsive);
  PQclear(res);
}

void load_links(PGconn *conn) {
  char querybuf[256];
  int i;
  PGresult   *res;
  progress_label("links");
  sprintf(querybuf, 
          "select input, output from links%u where confidence='high'", 
          target_asn);
  res = PQexec(conn, querybuf);
  if (PQresultStatus(res) != PGRES_TUPLES_OK) {
    fprintf(stderr, "select links table from db failed\n");
    fprintf(stderr, "res->status = %s\n", PQresStatus(PQresultStatus(res))); 
    
    PQclear(res);
    PQfinish(conn);
    exit(EXIT_FAILURE);
  }

  lm = lm_new(num_nodes);
  num_links = PQntuples(res);
  progress_n_of(0, num_links);
  for (i = 0; i < num_links; i++) {
    char *ip1_str = PQgetvalue(res,i,0);
    char *ip2_str = PQgetvalue(res,i,1);
    if(ip1_str != NULL && ip2_str != NULL) {
      unsigned short uid1, uid2;
      uid1 = uid_for_ip_fn(ip1_str);
      uid2 = uid_for_ip_fn(ip2_str);
      if((short) uid1 != -1 && (short) uid2 != -1) {
        lm_link(lm, uid1, uid2);
      } else if((short) uid1 != -1) {
        /* doubt: assume that we can't tell aliases in reverse direction */
        external_link(uid1, inet_addr(ip2_str));
      } else if((short) uid2 != -1) {
        external_link(uid2, inet_addr(ip1_str));
      }
    } else {
      fprintf(stderr, "bad table somehow\n");
    }
    if(i%1000 == 0) {
      progress_n_of(i, num_links);
    }
  }
  progress_n_of(num_links, num_links);
  PQclear(res);

}

boolean print_uidip(const struct uidip *a, 
                    void *unused __attribute__((unused))) {
  printf("%u %s\n", a->uid, inet_ntoa(*(struct in_addr *)&a->ip));
  return TRUE;
}

void load_auth_locations(void) {
  char cmdline[255];
  FILE *fp;
  sprintf(cmdline, "./show_authoritative.pl %u", target_asn);
  fp = popen(cmdline, "r");
  if(fp==NULL) {
    perror("popen");
    exit(EXIT_FAILURE);
  }
  fprintf(stderr, "loading locations...\r");
  while(!feof(fp)) {
    char stringbuffer[512];
    char *ipstr;
    char *name;
    char *loc;
    if(fgets(stringbuffer, 512, fp)) {
      struct in_addr ipaddr;
      ipstr = strtok(stringbuffer, " \t\n");
      name = strtok(NULL, " \n");
      loc = strtok(NULL, " \n");
      ipaddr.s_addr = inet_addr(ipstr);
      if(ipaddr.s_addr != INADDR_NONE) {
        unsigned short uid = uid_for_ip_fn(ipstr); 
        if((short) uid != (short) -1) {
          if(loc != NULL) {
            /* if we know the location, we can set it.
               otherwise, the field is left blank until
               another alias comes along */
            unsigned short locid = 
              strb_lookup(sb_locations, loc);
            if(locid==0) {
              locid = strb_bind(sb_locations, strdup(loc));
            }
            nodes[uid].location = locid;
            nodes[uid].bAuthoritative = TRUE;
          }
          if(name != NULL) {
            nodes[uid].name = strdup(name);
          }
        } else {
          fprintf(stderr, "warn: no aliases table entry for %s in %s\n", 
                  stringbuffer, loc);
        }
      } else {
        fprintf(stderr, "parsed '%s' poorly\n", stringbuffer);
      }
    }
  }
  fprintf(stderr, "done loading locations.\n");
  fclose(fp);
}

void recursive_mark_neighbors(unsigned short source,
                              unsigned short location) {
  // static int depth;
  unsigned int neighbuf[NEIGHBUFSZ];
  unsigned int numneighbors = NEIGHBUFSZ;
  unsigned int i;
  // fprintf(stderr, "%d: %u %s\n", depth++, source, 
  //        strb_resolve(sb_locations, location));
  lm_get_neighbors(lm, source, neighbuf, &numneighbors);
  for(i=0; i< numneighbors; i++) {
    unsigned int neighbor = neighbuf[i];
    if(!nodes[neighbor].bAuthoritative) {
      if(nodes[neighbor].bTop == 0) {
        if(nodes[neighbor].location != location) {
          if(nodes[neighbor].location != 0) {
            nodes[neighbor].bTop = 1;
            nodes[neighbor].location = -1;
          } else {
            nodes[neighbor].location = location;
            nodes[neighbor].bNotBottom = 1;
          }
          /* either way (loc->top, or bottom->loc, propagate */
          recursive_mark_neighbors(neighbor, location);
        } /* but if it's already top, nothing to do */
      } /* else, we're already been here */
    } /* else, we don't need to proceed  */
  }
  // --depth;
}

void infer_location(void) {
  unsigned short u;
  progress_label("inferring");
  progress_n_of(0, num_nodes);
  for(u=0;u<num_nodes;u++) {
    if(nodes[u].bAuthoritative) {
      recursive_mark_neighbors(u, nodes[u].location);
    }
  }
  progress_n_of(num_nodes, num_nodes);
}

void dump_cchfile(void) {
  char filename[40];
  FILE *fpc;
  int i;

  sprintf(filename, "%d.cch", target_asn);
  fpc = fopen(filename, "w");
  if(fpc == NULL) {
    perror("fopen");
    exit(EXIT_FAILURE);
  }
  for(i=0;i<num_nodes;i++) {
    unsigned int neighbuf[NEIGHBUFSZ];
    unsigned int numneighbors = NEIGHBUFSZ;
    lm_get_neighbors(lm, i, neighbuf, &numneighbors);
    if(numneighbors > 0) {
      unsigned int j;
      boolean isBackbone = FALSE;
      const char *l;
      if((short)nodes[i].location==-1) {
        assert(nodes[i].bTop == 1);
        num_top ++;
        l = "T";
      } else {
        l = strb_resolve(sb_locations, nodes[i].location);
        if(l==NULL) {
          num_question ++;
          l = "?";
        }
      }
      /* uid */
      fprintf(fpc, "%d ", i);
      /* location: city name, T (unknown, connected to different cities), or 
         ? (unknown, not connected) */
      fprintf(fpc, "@%s ", l);
      /* '+' = name from DNS (not inferred by connectivity) */
      fprintf(fpc, "%s ", nodes[i].bAuthoritative ? "+" : "");    
      for(j=0; j< numneighbors; j++) {
        if(nodes[neighbuf[j]].location != nodes[i].location) {
          isBackbone = TRUE;
        }
      }
      /* is a backbone node */
      fprintf(fpc, "%s\t", isBackbone ? "bb" : "");
      /* how many neighbors */
      fprintf(fpc, "(%d) ", numneighbors);
      /* if it has aliases, how many? */
      if(nodes[i].si_external != NULL)
        fprintf(fpc, "&%ld ", si_length(nodes[i].si_external));   
      fprintf(fpc, "-> ");
      /* uid of each neighbor */
      for(j=0; j< numneighbors; j++) {
        fprintf(fpc, "<%d> ", neighbuf[j]);
      }
      /* best name found;  if unresponsive to alias resolution, append ! */
      fprintf(fpc, "\t=%s%s", nodes[i].name,
              nodes[i].bResponsive ? "" : "!");
      fprintf(fpc, "\n");
    }
  }
  fprintf(fpc, "#in %d, saw %d links, %d nodes: %d ambiguous, %d disconnected\n", 
         target_asn, num_links, num_nodes, num_top, num_question );
  fclose(fpc);
}


int
main(int ac, char *av[]) {
  PGconn *conn;
  char conn_string[250];
  sb_locations = strb_new(300);
  
  (void)decode_switches (ac, av);
  if(target_asn == 0) {
    printf("need an asn\n");
    exit(EXIT_FAILURE);
  }

  sprintf(conn_string,"host=jimbo.cs.washington.edu dbname=mapping user=%s",getenv("USER"));
  conn = PQconnectdb(conn_string);
  load_uids(conn);
  // uidip_ht_iterate(uid_for_ip, print_uidip, NULL);
  
  nodes = (struct node *)malloc(sizeof(struct node) * num_nodes);
  memset(nodes, 0, sizeof(struct node) * num_nodes);
  
  load_auth_locations();
  
  load_links(conn);

  infer_location();

  load_responsive(conn);

  dump_cchfile();
  dump_poptable(conn);
  
  printf("in %d, saw %d links, %d nodes: %d ambiguous, %d disconnected\n", 
         target_asn, num_links, num_nodes, num_top, num_question );
  exit(0);
}

static boolean
db_delete_pop_table(PGconn *conn, unsigned short t_asn) {
  char querybuf[256];

  //sprintf(querybuf, "drop table aliases%u%s", target_asn, SKQ);
  sprintf(querybuf, "delete from router2pop%u", t_asn);
  return(db_do_command(conn, querybuf));
}

static boolean
db_create_pop_table(PGconn *conn, unsigned short t_asn) {
  char querybuf[256];

  sprintf(querybuf, "create table router2pop%u (ip inet, place text)", 
          t_asn);
  if(!db_do_command(conn, querybuf)) {
    printf("...ignoring\n");
  }
  return(TRUE);
}

static void
db_insert_poprouter(PGconn *conn, unsigned short t_asn,
                const char *ipaddr_str, const char *place) {
  char querybuf[256];

  sprintf(querybuf, "insert into router2pop%u (ip, place) values('%s', '%s')", 
          t_asn, ipaddr_str, place);
  (void) db_do_command(conn, querybuf);
}

boolean insert_poprouter(const struct uidip *u, void *conn) {
  db_insert_poprouter((PGconn *)conn, target_asn, 
                      inet_ntoa(*(struct in_addr *)&u->ip),
                      strb_resolve(sb_locations, nodes[u->uid].location));
  return TRUE;
}

void dump_poptable(PGconn *conn) {
  if(!db_begin_transaction(conn)) return;
  if(!db_delete_pop_table(conn, target_asn)) {
    db_do_command(conn, "abort");
    db_do_command(conn, "begin");
    db_create_pop_table(conn, target_asn); /* expect failure */
  }
  uidip_ht_iterate(uid_for_ip, insert_poprouter, conn);
  db_do_command(conn, "commit");
}
