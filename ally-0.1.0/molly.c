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

/* reads from a database table ("ally$target_asn"
   perl-style) to get the list of routers.  also reads the
   ally table to find what's been run already.  tries to run
   needed experiments to confirm that things are aliases or
   not.  If something doesn't reply, it's blacklisted for
   the remainder of the execution. */
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include <string.h>
#include <assert.h>
#include <ctype.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <sys/types.h>

#include "red_transitive.h"
#include "string_bindings.h"
#include "sorted_intlist.h"
#include "alias_matrix.h"
#include "ttl_hashtable.h"
#include "commandline.h"
#include "ally.h"

#ifdef HAVE_LIBPQ
#include "libpq-fe.h"
#include "postgresql.h"
PGconn     *conn;
#else 
void *conn;
#endif

/* globals.  they're really globals.  I tried to make them not globals. 
   it sucked.  */
red_transitive rtm;
string_bindings sb_both;
string_bindings sb_ip;
sorted_intlist unresponsive_nodes;
boolean use_ally;

extern const char *aux_filename;
extern boolean want_force;

/* now from commandline.h: */
/* unsigned short target_asn = 2914; */
/* char target_asname[100]; */
/* boolean want_verbose; */

static struct in_addr 
addr_for_idx(unsigned short a) {
  struct in_addr ret;
  const char * string = strb_resolve(sb_ip, a);
  
  if(string == NULL) ret.s_addr = 0;
  else if(inet_aton(string, &ret) == 0) {
    fprintf(stderr, 
            "warning: tried to convert '%s' to an in_addr, but inet_aton choked\n",
            string);
  }
  return(ret);
}


static void 
try_merge(unsigned short a, unsigned short b) {
  struct status st;
  static unsigned int badcommandcount;
  char querybuf[1024];
  int written;
  const char *ipstring_a = strb_resolve(sb_ip,a);
  const char *ipstring_b = strb_resolve(sb_ip,b);

  memset(&st, 0, sizeof(struct status));

  /* verify that our list is unique */
  assert(ipstring_a != NULL);
  assert(ipstring_b != NULL);
  if(strb_lookup(sb_ip, ipstring_a) != a || 
     strb_lookup(sb_ip, ipstring_b) != b ) {
    /* happens when including scanned things... */
    si_insert(unresponsive_nodes, (int)b);
    rtm_set_color(rtm, a, b, purple);
    printf("aborted: not the right node\n");
    return;
  }
  //  assert(strb_lookup(sb_ip, ipstring_a) == a);
  // assert(strb_lookup(sb_ip, ipstring_b) == b);
  /* make sure it's a valid address when initializing ally buffer. */
  assert(inet_aton(ipstring_a, &st.a) != 0);
  assert(inet_aton(ipstring_b, &st.b) != 0);

  ally_do(&st);
  if(st.ipid == 1 &&
     st.return_ttl == -1 &&
     st.out_ttl == -1 &&
     st.same_ip == -1 &&
     st.b_returns_a == -1 &&
     st.a_returns_b == -1 &&
     st.cisco == -1 ) {
    /* don't trust these... 50% of the time, they
       seem wrong, based on a later run of recheck_aliases. */
    sleep(10);
    ally_do(&st);
  }
     
  written = sprintf(querybuf, "insert into ally%u ", target_asn);
  ally_db_insert_string(&querybuf[written], &st);
  if(conn != NULL) {
#ifdef HAVE_LIBPQ
    PGresult   *res;
    res = PQexec(conn, querybuf);
    if (PQresultStatus(res) != PGRES_COMMAND_OK) {
      char delquerybuf[1024];
      fprintf(stderr, "insertion failed: res->status = %s, deleting first.\n", 
              PQresStatus(PQresultStatus(res))); 
      PQclear(res);
      sprintf(delquerybuf, "delete from ally%u where ip1='%s' and ip2='%s'", 
                        target_asn, ipstring_a, ipstring_b);
      res = PQexec(conn, delquerybuf);
      PQclear(res);
      res = PQexec(conn, querybuf);
      if (PQresultStatus(res) != PGRES_COMMAND_OK || badcommandcount > 5000) {
        PQfinish(conn);
        /*     dump_aliases(rtm, sb_ip);  */
        printf(" exiting due to repeated %u bad commands\n", badcommandcount);
        printf("res->status = %s for %s\n", 
               PQresStatus(PQresultStatus(res)), querybuf); 
        exit(0); 
      }
    } 
    PQclear(res);
#endif /* HAVE_LIBPQ */
  }
  printf("%s\n", querybuf);
  if(st.ipid == 1) {
    rtm_set_color(rtm, a, b, red);
    sleep(2); /* give it a couple seconds to recover... we might probe it again soon */
  } else if(st.ipid == -1) 
    rtm_set_color(rtm, a, b, green);
  if(st.a_responded == FALSE){
    printf("unresponsive: %u: %s\n", a, ipstring_a);
    si_insert(unresponsive_nodes, (int)a);
  } else {
    ttl_insert(st.a, st.a_return_ttl);
  }
  if(st.b_responded == FALSE){
    printf("unresponsive: %u: %s\n", b, ipstring_b);
    si_insert(unresponsive_nodes, (int)b);
  } else {
    ttl_insert(st.b, st.b_return_ttl);
  }
  printf("\n"); /* extra space between experiments */
}

/*@ unused @*/
static boolean 
criteria_true(/*@unused@*/unsigned short a __attribute__((unused)),
              /*@unused@*/unsigned short b __attribute__((unused)),
              /*@unused@*/void *user __attribute__((unused))) {
  return(TRUE);
}

static boolean 
criteria_ttl(unsigned short a,
             unsigned short b,
             /*@unused@*/void *user __attribute__((unused))) {
  struct in_addr ipa = addr_for_idx(a);
  struct in_addr ipb = addr_for_idx(b);
  unsigned char ttla = ttl_for_ip(ipa);
  unsigned char ttlb = ttl_for_ip(ipb);

  /* go for it if they're the same, or if we don't know. */
  return(ttla == ttlb || (int)ttla == 0 || (int)ttlb == 0);
}

static boolean 
criteria_ttl_delta(unsigned short a,
                   unsigned short b,
                   /*@unused@*/void *userDelta) {
  struct in_addr ipa = addr_for_idx(a);
  struct in_addr ipb = addr_for_idx(b);
  unsigned char ttla = ttl_for_ip(ipa);
  unsigned char ttlb = ttl_for_ip(ipb);
  int delta = (int)userDelta;

  /* go for it if they're the same, or if we don't know. */
  return((int)ttla == 0 || (int)ttlb == 0 || 
         (ttla+delta >= ttlb && ttlb+delta >= ttla));
}

static boolean 
criteria_adjacent(unsigned short a,
                  unsigned short b,
                  /*@unused@*/void *user __attribute__((unused))) {
  return((unsigned int)(b-a)<=1U|| (unsigned int)(a-b) <=1U);
}

static boolean 
criteria_fragment_match(unsigned short a,
                        unsigned short b,
                        void *fragments_needed_int) {
  int fragments_needed = (int) fragments_needed_int;
  int fragments_found = 0;
  const char *name_a;
  const char *name_b;
  char fragment_buf[100];
  const char *working_fragment_ptr;
  const char *fragment_end;
  for(name_a = strb_resolve(sb_both, a);
      *name_a != ' ' && *name_a != '\0';
      name_a ++);
  for(name_b = strb_resolve(sb_both, b);
      *name_b != ' ' && *name_b != '\0';
      name_b ++);
  if(*name_a == '\0') return (FALSE);
  if(*name_b == '\0') return (FALSE);
  name_a++; /* skip the space, for the children. */
  name_b++;
  
  for(working_fragment_ptr = name_b;
      working_fragment_ptr != NULL;
      working_fragment_ptr = fragment_end) {
    fragment_end = index(working_fragment_ptr + 1, '.');
    if(fragment_end != NULL) {
      unsigned int len = fragment_end - working_fragment_ptr + 1;
      strncpy(fragment_buf, working_fragment_ptr, len);
      fragment_buf[len]='\0';
      if(strstr(name_a, fragment_buf) != NULL) {
        fragments_found++;
        if(fragments_found >= fragments_needed) {
          /* fprintf(stderr, "%s and %s matched all %d needed fragments\n",
             name_a,  name_b,  fragments_found); */
          return(TRUE);
        }
      }
    }
  }
  return(FALSE);
}
 
boolean criteria_ttl_and_name(unsigned short a,
                              unsigned short b,
                              void *fragments_needed_int) {
  return(criteria_ttl(a,b,NULL) && criteria_fragment_match(a,b,fragments_needed_int));
}

boolean criteria_ttl_d1_and_name(unsigned short a,
                                 unsigned short b,
                                 void *fragments_needed_int) {
  return(criteria_ttl_delta(a,b,(void *)1) && 
         criteria_fragment_match(a,b,fragments_needed_int));
}
boolean criteria_ttl_d2_and_name(unsigned short a,
                                 unsigned short b,
                                 void *fragments_needed_int) {
  return(criteria_ttl_delta(a,b,(void *)2) && 
         criteria_fragment_match(a,b,fragments_needed_int));
}


/* criteria can be: ttl match, name match, ip match, etc. */
static void 
try_all_pairs_meeting( boolean (*criteria_cb)(unsigned short a, 
                                              unsigned short b, 
                                              /*@null@*/ void *user),
                       /*@null@*/void *user,
                       boolean bForce) {
  boolean didwork;
  unsigned short us;
  unsigned short start;
  unsigned short num_nodes = strb_count(sb_ip);

  /* I say to those with 8-character tab stops, ":set
     ts=2" */
  /* be cool to express this loop with tail-recursion... */
  do{
    didwork = FALSE; 
    for(start = 1; start <= 2; start ++) { /* odd and even starting points */
      /* spread things out just a bit with very little state */
      /* may be mildly buggy - it may skip the last pair of work to be 
         done if the moon is aligned with saturn */
      unsigned short last_b = 0;
      for(us=1; us < num_nodes - 1; us+=2) {
        if(!si_member(unresponsive_nodes, (int)us)) {
          unsigned short next_unknown;
          if(want_verbose) printf("matching %u   \r", us);

          /* keep looking for another alias candidate, so long as */
          for(next_unknown = us+1;
              /* we're not done, but */
              next_unknown != us && 
                /* it's the one we just matched with last time, or */
                (next_unknown == last_b ||  
                 /* we don't want it, or */
                 !criteria_cb(us, next_unknown, user) ||  
                 /* it's unresponsive, or */
                 si_member(unresponsive_nodes, (int)next_unknown) || 
                 /* we have already tried it. */
                 (!bForce && rtm_get_color(rtm, us, next_unknown) != black ) ||
                 (rtm_get_color(rtm, us, next_unknown) == red ) ); 
              next_unknown = (next_unknown == strb_count(sb_ip) - 1) ?
                (unsigned short)1U : next_unknown + 1);
          /* that's right, no loop body. gotta love this language */
          
          if(next_unknown != us) {
            if(us != last_b && next_unknown != last_b) {
              printf("trying: %s/%u\n", strb_resolve(sb_both, us),us);
              printf("      : %s/%u\n", strb_resolve(sb_both, next_unknown),
                     next_unknown);
              try_merge(us, next_unknown);
              last_b = next_unknown;
            } else {
              printf("skipped for hotspot dispersion\n");
            }
            /* even if we skipped, we still need to claim to have done
               work, so that we keep working */
            didwork = TRUE;
          } else {
            if(want_verbose) printf("done with %u      \r", us);
          }
          /* } else {  uninterestingly common...
             printf("skipping %u as down\n", us ); */
        } /* responsive us */
      } /* each us */
    } /* odd and even */
  } while(didwork && !bForce);
}

time_t starttime;

int 
main(int argc, char *argv[]) {
#ifdef HAVE_LIBPQ
  boolean use_database = TRUE;
#endif
  use_ally = ally_init();
  /* drop setuid priviledge now that we have the raw socket */
  seteuid(getuid());

  if(use_ally == FALSE) {
    fprintf(stderr, "error: not running with ally.  make this program setuid.\n");
    exit(EXIT_FAILURE);
  }

  (void)decode_switches(argc,argv);
  unresponsive_nodes = si_new();

#ifdef HAVE_LIBPQ
  if(!load_router_list(target_asn, target_asname, aux_filename, &conn, &sb_both, &sb_ip)) {
    fprintf(stderr, "unable to load router list\n");
    exit(EXIT_FAILURE);
  }
#endif
  
  /* strb_print(sb_both, stdout); */
  /* strb_print(sb_ip, stdout); */
  fprintf(stderr, "creating new red transitive matrix...\n");
  rtm = rtm_new(strb_count(sb_ip));

#ifdef HAVE_LIBPQ
  /* load known bindings from the database, if present */
  fprintf(stderr, "loading aliases already discovered...\n");
  use_database = load_db_aliases(conn, rtm, sb_ip, target_asn, TRUE); 
#endif

  if(want_force) {
    try_all_pairs_meeting(criteria_adjacent, NULL, TRUE);
  }
  fprintf(stderr, "**** ADJACENT ****\n");
  try_all_pairs_meeting(criteria_adjacent, NULL, FALSE);
  /* just excessive 
     fprintf(stderr, "**** TTL and Name7 ****\n"); 
     try_all_pairs_meeting(criteria_ttl_and_name, (void *)7); 
     fprintf(stderr, "**** TTL and Name6 ****\n");
     try_all_pairs_meeting(criteria_ttl_and_name, (void *)6); */
  /* these two are flat, so skip the name matching things to
     save on cycles. */
  if(target_asn != 1239 && target_asn != 1221) {
    fprintf(stderr, "**** TTL and Name5 ****\n");
    try_all_pairs_meeting(criteria_ttl_and_name, (void *)5, FALSE);
    fprintf(stderr, "**** TTL and Name4 ****\n");
    try_all_pairs_meeting(criteria_ttl_and_name, (void *)4, FALSE);
    fprintf(stderr, "**** TTL delta 1 and Name4 ****\n");
    try_all_pairs_meeting(criteria_ttl_d1_and_name, (void *)4, FALSE);
    fprintf(stderr, "**** TTL delta 1 and Name3 ****\n");
    try_all_pairs_meeting(criteria_ttl_d1_and_name, (void *)3, FALSE);
    fprintf(stderr, "**** TTL delta 2 and Name3 ****\n");
    try_all_pairs_meeting(criteria_ttl_d2_and_name, (void *)3, FALSE);
  } else {
    fprintf(stderr, "**** TTL ****\n");
    try_all_pairs_meeting(criteria_ttl, NULL, FALSE);
  }
  fprintf(stderr, "**** TTL delta 2 and Name2 ****\n"); /* good for tiscali.de, perhaps? */
  try_all_pairs_meeting(criteria_ttl_d2_and_name, (void *)2, FALSE);
  fprintf(stderr, "**** TTL ****\n");
  try_all_pairs_meeting(criteria_ttl, NULL, FALSE);
  /* not clear if there should be a name-only pass. */
  /* try_all_pairs_meeting(criteria_true, NULL); */

  printf("done\n");

  return(0);
}

