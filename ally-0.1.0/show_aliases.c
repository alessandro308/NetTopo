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

unsigned short target_asn = 2914;
char target_asname[100];
boolean want_verbose;
boolean want_sk;
extern char *jgr_output;
extern char *xpm_output;

int
main(int ac, char *av[]) {
#ifdef HAVE_LIBPQ
  PGconn *conn;
  string_bindings sb_both;
  string_bindings sb_ip;
  red_transitive rtm;

  (void)decode_switches (ac, av);

  if(!load_router_list(target_asn, target_asname, NULL, &conn, &sb_both, &sb_ip)) 
    exit(EXIT_FAILURE);

  rtm = rtm_new(strb_count(sb_ip));
  
  fprintf(stderr, "loading aliases ...\n");
  if(!load_db_aliases(conn, rtm, sb_ip, target_asn, FALSE)) {
    printf("no database\n");
    exit(EXIT_FAILURE);
  }
  fprintf(stderr, "...done\n");
  fprintf(stderr, "verifying alias table integrity...\n");
  if(!rtm_integrity_check(rtm)) {
    printf("failed alias matrix integrity check\n");
    exit(EXIT_FAILURE);
  }
  fprintf(stderr, "...done\n");

  if(jgr_output) {
    dump_aliases_jgr(rtm, jgr_output);
  } else if(xpm_output) {
    dump_aliases_xpm(rtm, xpm_output);
  } else {
    dump_aliases_db(conn, rtm, sb_ip, target_asn);
  }
  exit(EXIT_SUCCESS);
#else
  printf("show_aliases isn't useful without database support");
  exit(EXIT_FAILURE);
#endif
}
