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
#include "config.h"
#endif
#include "alias_matrix.h"
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "commandline.h"
#include "ally.h"
#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#ifdef HAVE_LIBPQ
#include "postgresql.h"
#else
#error "recheck_aliases requires postgresql"
#endif

unsigned short target_asn = 2914;
char target_asname[100];
boolean want_verbose;
extern boolean want_force;

extern boolean rechecking; /* configure ally. */

void 
recheck_aliases_helper(PGconn *conn, string_bindings sb_ip, 
                       unsigned short a, unsigned short b,
                       int ipid, /*@unused@*/int return_ttl __attribute__((unused)), 
                       /*@unused@*/ /*@null@*/void *dummy __attribute__((unused))) {
  /* reduced copy and paste from molly's try_merge */
  struct status st;
  char querybuf[1024];
  char delquerybuf[1024];
  int written;
  const char *ipstring_a = strb_resolve(sb_ip,a);
  const char *ipstring_b = strb_resolve(sb_ip,b);

  if(conn == NULL) { return; }
  if(ipid != 1) { return; } /* don't need to reconfirm non-aliases */

  memset(&st, 0, sizeof(struct status));

  /* verify that our list is unique */
  assert(ipstring_a != NULL);
  assert(ipstring_b != NULL);
  assert(strb_lookup(sb_ip, ipstring_a) == a);
  assert(strb_lookup(sb_ip, ipstring_b) == b);
  /* make sure it's a valid address when initializing ally buffer. */
  assert(inet_aton(ipstring_a, &st.a) != 0);
  assert(inet_aton(ipstring_b, &st.b) != 0);

  ally_do(&st);
  
  /* don't do anything if unresponsive */
  if(st.ipid != 0 || want_force) {
    /* run the deletion; could just update, but that's the same thing,
       and this is consistent with the insert-into behavior */
    sprintf(delquerybuf, "delete from ally%u where ip1='%s' and ip2='%s'", 
            target_asn, ipstring_a, ipstring_b);
    db_do_command(conn, delquerybuf);
    written = sprintf(querybuf, "insert into ally%u ", target_asn);
    ally_db_insert_string(&querybuf[written], &st);
    db_do_command(conn, querybuf);
    printf("%s\n", querybuf);
  } else {
    printf("skipped replacement with unresponsive\n");
  }
  printf("\n"); /* extra space between experiments */
  
}

void 
recheck_aliases(PGconn *conn, string_bindings sb_ip) {
  (void)foreach_ally(conn, target_asn, sb_ip, "recheck", FALSE, recheck_aliases_helper, NULL);
}

int
main(int ac, char *av[]) {
  PGconn *conn;
  string_bindings sb_both;
  string_bindings sb_ip;

  rechecking = TRUE;

  ally_init();
  /* drop setuid priviledge now that we have the raw socket */
  seteuid(getuid());

  (void)decode_switches (ac, av);
  if(!load_router_list(target_asn, target_asname, NULL, &conn, &sb_both, &sb_ip)) {
    fprintf(stderr, "unable to load router list...\n");
    exit(EXIT_FAILURE);
  }
  
  fprintf(stderr, "reconfirming ...\n");
  recheck_aliases(conn, sb_ip);
  
  exit(EXIT_SUCCESS);
}

