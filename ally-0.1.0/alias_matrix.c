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

#ifdef HAVE_CONFIG_H
#include <config.h>
#endif
/* get asprintf */
#define _GNU_SOURCE
#include <assert.h>
#include <ctype.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>
#include "red_transitive.h"
#include "string_bindings.h"
#include "sorted_intlist.h"
#include "alias_matrix.h"
#include "progress.h"

#ifdef HAVE_LIBPQ
#include "postgresql.h"
#endif
#include "nscommon.h"

extern boolean want_sk;

/* returns -1 if a<b, 0 if a==b, 1 if a>b */
/* if a is shorter than b, -1 */
/* if b is shorter than a, 1 */
static int 
indirect_backward_name_compare( const char **ppa, const char **ppb ) {
  const char *a = (*ppa);
  const char *b = (*ppb);
  const char *ap = a + strlen(a);
  const char *bp = b + strlen(b);
  int ret;
  /* check for ip addresses */
  const char *aip = ap;
  const char *bip = bp;
  while(*aip == '.' || isdigit(*aip)) aip--; /* should run into a space if ip */
  while(*bip == '.' || isdigit(*bip)) bip--; /* should run into a space if ip */
  if(*aip == ' ' && *bip == ' ') {
    ret = strcmp(aip, bip); /* might as well string compare the ip's... don't matter much */
  } else {
    for(ap = a + strlen(a), bp = b + strlen(b);
        ap>=a && bp>=b && *ap == *bp;
        ap--, bp--);
    if(ap < a && bp < b) {
      /* we've run out of string. */
      ret = 0;
    } else if( ap < a ) {
      /* a is shorter than b */
      while(b<bp && *bp!='.' && *bp!=' ') bp--;
      ret = (strcmp(a,bp));
    } else if( bp < b ) {
      /* b is shorter than a, walk a back to the next fragment and compare. */
      while(a<ap && *ap!='.' && *ap!=' ') ap--;
      ret = (strcmp(ap,b));
    } else {
      /* we found a difference, walk both back and strcmp */
      while(a<ap && *ap!='.' && *ap!=' ') ap--;
      while(b<bp && *bp!='.' && *bp!=' ') bp--;
      ret = (strcmp(ap,bp));
    }
  }
  // printf("compare '%s' %s '%s'\n", a, b, (ret>=0) ? ((ret==0) ? "=" : ">") : "<");
  return(ret);
    /* 
       if( *ap < *bp ) {
       return(-1);
       } else 
       return(1);
    */
}

static void 
populate_strings_helper(string_bindings sb, 
                        FILE *fp_rtrs) {
  /* file should be formatted "ip-addr name" on each line */
  while(feof(fp_rtrs) == 0) {
    char buf[1024];
    if(fgets(buf, 1024, fp_rtrs)) {
      if(isdigit(buf[0])) { /* deals with comments and other lines */
        buf[strlen(buf)-1] = '\0'; /* drop newline */
        (void)strb_bind(sb, strdup(buf)); /* just store in the bindings for now */
      }
    }
  }
}

void insert_stringbinding(const char **row, void *sbptr) {
  string_bindings sb = (string_bindings)sbptr;
  assert(sb != NULL);
  /* skip obviously dialup routers */
  if(strstr(row[1], "dialup") == NULL &&
     strstr(row[1], "dial1") == NULL &&
     strncmp(row[1], "nas", 3) != 0 &&
     strstr(row[1], "dial-") == NULL) {
    char *str;
    asprintf(&str, "%s %s", row[0], row[1]);
    if(strb_lookup(sb,str) == 0) {
      (void)strb_bind(sb, str);
    }
  }
}

/*@null@*/
string_bindings 
populate_strings(const char *filename) {
  FILE *fp_rtrs = fopen(filename, "r");
  string_bindings sb=strb_new(4000);
  assert(sb!=NULL);
  if(fp_rtrs == NULL) {
    fprintf(stderr, "gimme %s\n", filename);
    strb_delete(sb);
    return NULL;
  }
  populate_strings_helper(sb, fp_rtrs);
  (void)fclose(fp_rtrs);
  strb_sort_and_rebind(sb, indirect_backward_name_compare);
  return(sb);
}

#ifdef HAVE_LIBPQ
string_bindings 
populate_strings_db(PGconn *conn, const char *tablename, const char *asname) {
  char querybuf[256];
  string_bindings sb = strb_new(4000);
  assert(sb!=NULL);
  snprintf(querybuf, 256, 
           "select ip, MAX(name) from %s where name like '%%%s%%' group by ip", 
           tablename, asname);
  db_do_query(conn, querybuf, insert_stringbinding, sb);
  strb_sort_and_rebind(sb, indirect_backward_name_compare);
  return(sb);
}

/*@null@*/
string_bindings 
populate_strings_both(PGconn *conn, const char *tablename, 
                      const char *asname, const char *aux_filename) {
  char querybuf[256];
  FILE *fp_rtrs = fopen(aux_filename, "r");
  string_bindings sb=strb_new(4000);
  assert(sb!=NULL);
  if(fp_rtrs == NULL) {
    fprintf(stderr, "gimme %s\n", aux_filename);
    strb_delete(sb);
    return NULL;
  }
  populate_strings_helper(sb, fp_rtrs);
  (void)fclose(fp_rtrs);

  snprintf(querybuf, 256, "select ip, MAX(name) from %s where name like '%%%s%%' group by ip", 
          tablename, asname);
  db_do_query(conn, querybuf, insert_stringbinding, sb);
  strb_sort_and_rebind(sb, indirect_backward_name_compare);
  return(sb);
}
#endif

string_bindings 
extract_and_dup(string_bindings sb_both) {
  unsigned short i=1;
  const char *fullstring;
  string_bindings sb_ip = strb_new(4000);
  while((fullstring = strb_resolve(sb_both, i++)) != NULL) {
    char *end = index(fullstring, ' ');
    char *ipstring = malloc((size_t) (end-fullstring+1));
    assert(ipstring!=NULL);
    strncpy(ipstring, fullstring, (size_t) (end-fullstring));
    ipstring[end-fullstring] = '\0';
    (void)strb_bind(sb_ip,ipstring);
  }
  return(sb_ip);
}


#ifdef HAVE_LIBPQ
boolean load_router_list(unsigned short target_asn, 
                         const char *target_asname, 
                         /*@null@*/ const char *aux_filename,
                         /*@out@*/ PGconn **conn, 
                         /*@out@*/ string_bindings *sb_both, 
                         /*@out@*/ string_bindings *sb_ip) {
  char tablename[100];
  const char *tabletype = "uip";
  (*sb_ip) = NULL;
  if(want_sk) 
    sprintf(tablename, "(select * from %s%u UNION select * from %s%usk) as q", tabletype, target_asn, tabletype, target_asn);
  else
    sprintf(tablename, "%s%u", tabletype, target_asn);
  
  /* load known bindings from the database, if present */
  (*conn) = PQconnectdb("host=jimbo.cs.washington.edu dbname=mapping user=nspring");

  fprintf(stderr, "note: this takes 85MB on jimbo.  if you don't got the ram, stop now.\n");
  fprintf(stderr, "loading router ip's from %s...\n", tablename);
  if(aux_filename != NULL) {
    (*sb_both) = populate_strings_both(*conn, tablename, target_asname, aux_filename);
  } else {
    (*sb_both) = populate_strings_db(*conn, tablename, target_asname);
  }
  if(*sb_both == NULL) return FALSE;
  fprintf(stderr, "...done\n");

  fprintf(stderr, "splitting ip's from names...\n");
  (*sb_ip) = extract_and_dup(*sb_both);
  fprintf(stderr, "...done\n");

  if(strb_resolve(*sb_both,1) == NULL) { 
    printf(" no routers in table %s\n", tablename);
    return FALSE;
  }
  /* check to make sure things went ok */
  assert(strncmp( strb_resolve(*sb_both, 1), 
                  strb_resolve(*sb_ip, 1), 8) == 0);
  assert(strncmp( strb_resolve(*sb_both, 16), 
                  strb_resolve(*sb_ip, 16), 8) == 0);
  return TRUE;
}
#endif

void
dump_aliases(const red_transitive rtm, 
             const string_bindings sb_ip) {
  unsigned short i;
  for(i = 1;  i< strb_count(sb_ip); i++) {
    unsigned int buf[300];
    unsigned int neigh = 300;
    rtm_get_red_neighbors(rtm, i, buf, &neigh);
    if(neigh == 0) {
      printf("%s (%u)\n", strb_resolve(sb_ip, i), i);
    } else if(neigh > 0 && buf[0] > i) {
      unsigned short j;
      printf("%s (%u) ", strb_resolve(sb_ip, i), i);
      for( j = 0 ; j < neigh; j++ ) {
        printf("%s (%u) ", strb_resolve(sb_ip, buf[j]), buf[j]);
      }
      printf("\n");
    }
  }
}

static void 
print_colored_points(FILE *fpjgr,
                     const red_transitive rtm,
                     rtm_color desired_color) {
  unsigned short i,j;
  unsigned short dim = (unsigned short)rtm_get_dim(rtm);
  for(i = 1;  i< dim; i++) {
    for(j = 1;  j< dim; j++) {
      rtm_color c = rtm_get_color(rtm, i, j);
      if(c == desired_color) {
        fprintf(fpjgr, "%u %u\n", i, j);
      }
    }
  }
}

extern boolean want_verbose;
void dump_aliases_jgr(const red_transitive rtm, 
                      const char *jgr_output) {
  FILE *fpjgr = fopen(jgr_output, "w");
  const char *all_curve = "newcurve marktype box marksize 0.001 0.001";
  if(fpjgr == NULL) {
    printf("failed to open %s: %s", jgr_output, strerror(errno));
    return;
  }
  fprintf(fpjgr, "newgraph\n");
  fprintf(fpjgr, "xaxis min 0\n");
  fprintf(fpjgr, "yaxis min 0\n");

  if(want_verbose) fprintf(stderr, "traversing red 1/3...\r");
  fprintf(fpjgr, "%s color 0.7 0.1 0.1 pts\n", all_curve);
  print_colored_points(fpjgr, rtm, red);

  if(want_verbose) fprintf(stderr, "traversing green 2/3...\r");
  fprintf(fpjgr, "%s color 0.1 0.9 0.1 pts\n", all_curve);
  print_colored_points(fpjgr, rtm, green);

  if(want_verbose) fprintf(stderr, "traversing purple 3/3...\r");
  fprintf(fpjgr, "%s color 0.4 0.1 0.6 pts\n", all_curve);
  print_colored_points(fpjgr, rtm, purple);

  (void) fclose(fpjgr);
}
void dump_aliases_xpm(const red_transitive rtm, const char *xpm_output) {
  FILE *fpxpm = fopen(xpm_output, "w");
  unsigned short i, j, dim;
  if(fpxpm == NULL) return;
  dim = (unsigned short)rtm_get_dim(rtm);
  fprintf(fpxpm, "/* XPM */\n");
  fprintf(fpxpm, "static char *allyCompletion[] = {\n");
  fprintf(fpxpm, "/* width height num_colors chars_per_pixel */\n");
  fprintf(fpxpm, "\" %u %u 6 1\",\n", dim-1, dim-1);
  fprintf(fpxpm, "/* colors */\n");
  fprintf(fpxpm, "\". c #000000\",\n");
  fprintf(fpxpm, "\", c #202020\",\n");
  fprintf(fpxpm, "\"r c #ff5050\",\n");
  fprintf(fpxpm, "\"g c #30e030\",\n");
  fprintf(fpxpm, "\"d c #206020\",\n");
  fprintf(fpxpm, "\"p c #ff60ff\",\n");
  fprintf(fpxpm, "/* pixels */\n");
  progress_label("xpm");
  for(i=1;i<dim;i++) {
    boolean isDead = TRUE;
    fprintf(fpxpm, "\"");
    progress((float)i/(float)dim);
    for(j=1;j<dim && isDead;j++) {
      rtm_color c = rtm_get_color(rtm,i,j);
      if(c==red || c==green) isDead = FALSE;
    }
    for(j=1;j<dim;j++) {
      char me;
      if(j<=i) me=',';
      else { 
        rtm_color c = rtm_get_color(rtm,i,j);
        if(isDead)
          switch(c) {
          case purple: me='p'; break;
          default: me='d'; 
          }
        else 
          switch(c) {
          case red: me='r'; break;
          case green: me='g'; break;
          case black: me='.'; break;
          case purple: me='p'; break;
          default: me='x'; break; /* warning removal */
          }
      }
      fprintf(fpxpm, "%c", me);
    }
    fprintf(fpxpm, "\"%s\n", (i<dim-1)? "," : "" );
  }
  progress(1.0);
  fprintf(fpxpm, "\",\n");
}

#ifdef HAVE_LIBPQ
#define SKQ ((want_sk) ? "sk" : "")
static boolean
db_create_alias_table(PGconn *conn, unsigned short target_asn) {
  char querybuf[256];

  // sprintf(querybuf, "create table aliases%u%s (ip inet, uid integer, responsive integer)", target_asn, SKQ);
  sprintf(querybuf, "create table aliases%u%s (ip inet, uid integer)", target_asn, SKQ);
  if(!db_do_command(conn, querybuf)) {
    printf("...ignoring\n");
  }
  return(TRUE);
}

static boolean
db_delete_alias_table(PGconn *conn, unsigned short target_asn) {
  char querybuf[256];

  sprintf(querybuf, "drop table aliases%u%s", target_asn, SKQ);
  db_do_command(conn, querybuf);
  (void)db_create_alias_table(conn, target_asn); /* expect failure */
  return(TRUE);
  //sprintf(querybuf, "delete from aliases%u%s", target_asn, SKQ);
  //return(db_do_command(conn, querybuf));
}

static void
db_insert_alias(PGconn *conn, unsigned short target_asn,
                const char *ipaddr_str, unsigned short router_uid,
                /*@unused@*/ boolean responsive __attribute__((unused))) {
  char querybuf[256];

  // sprintf(querybuf, "insert into aliases%u%s (ip, uid, responsive) "
  sprintf(querybuf, "insert into aliases%u%s (ip, uid) "
          "values('%s', %u)", 
          target_asn, SKQ, ipaddr_str, router_uid
          // responsive ? 1 : 0);
          );
  (void) db_do_command(conn, querybuf);
}

void
dump_aliases_db(PGconn *conn, const red_transitive rtm, 
                const string_bindings sb_ip, unsigned short target_asn) {
  /* the uid we output is something small, for ease of import by 
     CAIDA's "otter" tool */
  unsigned short i;
  unsigned short compressed_index = 0; /* keep the router indices 0 to num-1; */
  
  if(!db_begin_transaction(conn)) return;
  if(!db_delete_alias_table(conn, target_asn)) {
    db_do_command(conn, "abort");
    db_do_command(conn, "begin");
    db_create_alias_table(conn, target_asn); /* expect failure */
  }
  for(i = 1;  i< strb_count(sb_ip); i++) {
    unsigned int buf[300];
    unsigned int neigh = 300;
    boolean responsive = rtm_get_red_neighbors(rtm, i, buf, &neigh);
    if(neigh == 0) {
      /* we have no neighbors; check to make sure we're not unresponsive */
      db_insert_alias(conn, target_asn, strb_resolve(sb_ip,i), compressed_index, responsive);
      compressed_index++;
    } else if(neigh > 0 && buf[0] > i) { /* if our first neighbor is &lt us, it's
                                            already been written */
      unsigned short j;
      db_insert_alias(conn, target_asn, strb_resolve(sb_ip,i), compressed_index, TRUE);
      for( j = 0 ; j < neigh; j++ ) {
        db_insert_alias(conn, target_asn, strb_resolve(sb_ip,buf[j]), compressed_index, TRUE);
      }
      compressed_index++;
    }
  }
  db_commit_transaction(conn);
}

boolean 
foreach_ally(PGconn *conn, 
             unsigned short target_asn, 
             const string_bindings sb_ip,
             const char *description,
             boolean all_edges,
             void (*alias_cb)(PGconn *conn,
                              const string_bindings sb_ip, 
                              unsigned short node1, 
                              unsigned short node2,
                              int ipid,
                              int return_ttl, 
                              void *a),
             void *a) {
  /* check to see that the backend connection was successfully made */
  if (PQstatus(conn) == CONNECTION_BAD) {
    fprintf(stderr, "Connection to database failed.\n");
    fprintf(stderr, "%s", PQerrorMessage(conn));
    fprintf(stderr, "Will not populate matrix with database info.\n");
    return(FALSE);
  } else {
    unsigned int i, ntup;
    char querybuf[256];
    PGresult   *res;
    progress_label(description);
    sprintf(querybuf, "select ip1, ip2, ipid, return_ttl from ally%u%s", 
            target_asn, all_edges ? "" : " where ipid=1");
    res = PQexec(conn, querybuf);
    if (PQresultStatus(res) != PGRES_TUPLES_OK) {
      fprintf(stderr, "select aliases from db failed\n");
      fprintf(stderr, "res->status = %s\n", PQresStatus(PQresultStatus(res))); 

      PQclear(res);
      PQfinish(conn);
      exit(EXIT_FAILURE);
    }
    ntup = PQntuples(res);
    progress_n_of(0, ntup);
    /* next, print out the instances */
    for (i = 0; i < ntup; i++) {
      unsigned short node1 = strb_lookup(sb_ip, PQgetvalue(res,i,0));
      unsigned short node2 = strb_lookup(sb_ip, PQgetvalue(res,i,1));
      if(node1 > 0 && node2 > 0) {
        char *ipid_str = PQgetvalue(res,i,2);
        int ipid = atoi(ipid_str);
        char *return_ttl_str = PQgetvalue(res,i,3);
        int return_ttl = atoi(return_ttl_str);
        (*alias_cb)(conn, sb_ip, node1, node2, ipid, return_ttl, a);
      }
      if(i%1000 == 0) {
        progress_n_of(i, ntup);
      }
    }
    progress_n_of(ntup, ntup);
    PQclear(res);
  }
  return (TRUE);
}

static void 
load_db_aliases_helper(/*@unused@*/ PGconn *conn __attribute__((unused)), 
                       /*@unused@*/ string_bindings sb_ip __attribute__((unused)),
                       unsigned short node1, 
                       unsigned short node2,
                       int ipid, /*@unused@*/ 
                       int return_ttl __attribute__((unused)), void *vrtm) {
  red_transitive rtm = (red_transitive)vrtm;
  if(ipid != 0) {
    /* the old scheme - if ipid and return ttl match: red
       if ipid but not return_ttl: black (try again later)
       if neither, green.
       if ipid = 0, assume it's lame. */
    /* ipid is pretty good by itself now... */
    rtm_set_color(rtm, node1, node2, (ipid==1) ? red : green);
  } else {
    rtm_set_color(rtm, node1, node2, purple );
  }
}

                                    

boolean load_db_aliases(PGconn *conn,
                        red_transitive rtm, 
                        string_bindings sb_ip, 
                        unsigned short target_asn,
                        boolean all_edges) {
  return(foreach_ally(conn, target_asn, sb_ip, "load_db", 
                      all_edges, load_db_aliases_helper, rtm));
}

#endif
