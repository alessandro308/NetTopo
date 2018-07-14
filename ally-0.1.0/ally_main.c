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
#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/types.h>
#include <string.h>
#include "ally.h"
#include "nscommon.h"

void fill_in_address(const char *name_or_address, struct in_addr *addr) {
  if(inet_aton(name_or_address, addr) == 0) {
    struct hostent *host_info = gethostbyname(name_or_address);
    if(host_info == NULL) {
      printf ("dude! wtf is '%s'?\n", name_or_address);
      exit(EXIT_FAILURE);
    }
    addr->s_addr = ((struct in_addr *)(host_info->h_addr_list[0]))->s_addr;
  }
}

int main(int ac, char *argv[]) {
  struct status status;
  boolean database_output;
  int iparg = 1;

  if(!ally_init()) {
    printf("%s: must be run as root.\n", argv[0]);
    exit(EXIT_FAILURE);
  }

  seteuid(getuid()); /* drop elevated priviledge, if any */

  memset(&status, 0, sizeof(struct status));

  if(ac < 3) {
    printf ("gimme two ips or names.\n");
    exit(EXIT_FAILURE);
  }
  if(strcmp(argv[iparg], "--db") == 0) {
    database_output = TRUE;
    iparg++;
  } else {
    database_output = FALSE;
  }
  
  fill_in_address(argv[iparg], &status.a);
  fill_in_address(argv[iparg+1], &status.b);

  ally_do(&status);
  ally_print_status(&status, database_output);

  exit(EXIT_SUCCESS);
}
