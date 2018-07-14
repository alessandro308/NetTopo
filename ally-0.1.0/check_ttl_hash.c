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

#include "config.h"
#include <stdio.h>
#include <stdlib.h>
#ifdef HAVE_CHECK_H
#include <check.h>
#include "ttl_hashtable.h"


#define fail_expect_int(result,expect,msg) do { \
  char buf[255]; \
  int r = result; \
  sprintf(buf, "%s (got %d, expected %d)", msg, (r), (expect)); \
  _fail_unless((r)==(expect),__FILE__,__LINE__,buf); \
} while(0)


START_TEST(test_basic)
{
  struct in_addr addr1;
  struct in_addr addr2;
  struct in_addr addr3;
  struct in_addr addr4;
  struct in_addr addr5;
  inet_aton("1.0.0.1", &addr1);
  inet_aton("1.0.0.2", &addr2);
  inet_aton("1.0.0.3", &addr3);
  inet_aton("1.0.0.4", &addr4);
  inet_aton("1.0.0.5", &addr5);
  ttl_insert(addr1, 1);
  ttl_insert(addr2, 2);
  ttl_insert(addr3, 3);
  /* don't insert 4! */
  ttl_insert(addr5, 1);
  ttl_insert(addr5, 5);
  fail_expect_int(ttl_for_ip(addr1), 1, "failure on 1");
  fail_expect_int(ttl_for_ip(addr2), 2, "failure on 2");
  fail_expect_int(ttl_for_ip(addr3), 3, "failure on 3");
  fail_expect_int(ttl_for_ip(addr4), 0, "failure on unknown");
  fail_expect_int(ttl_for_ip(addr5), 5, "failure on updated");
}
END_TEST


Suite *si_suite (void) 
{ 
  Suite *s = suite_create("ttl hashtable"); 
  TCase *tc_core = tcase_create("bottom");
 
  suite_add_tcase (s, tc_core);
 
  tcase_add_test (tc_core, test_basic); 
  return s; 
}
 
int main (void) 
{ 
  int nf; 
  Suite *s = si_suite(); 
  SRunner *sr = srunner_create(s); 
  srunner_run_all (sr, CK_NORMAL); 
  nf = srunner_ntests_failed(sr); 
  srunner_free(sr); 
  suite_free(s); 
  return (nf == 0) ? EXIT_SUCCESS : EXIT_FAILURE; 
}

#else
#warning "Install check from sourceforge.net and autoreconf; configure"
int main(void) {
	exit(EXIT_SUCCESS);
}
#endif
