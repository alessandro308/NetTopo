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

#include <sys/types.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#ifndef WIN32
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#else
#include "win32.h"
#endif

unsigned int ipv4_addr_from_string(char *x)
{
  int a,b,c,d;
  unsigned int t;

  a=b=c=d=0;
  if (sscanf(x,"%d.%d.%d.%d",&a,&b,&c,&d)>0){
    return(htonl(a<<24|b<<16|c<<8|d));
  } else {
    sscanf(x,"x%x",&t);
    return(htonl(t));
  }
}

struct sockaddr_in *make_numeric_sockaddr_in(unsigned int host,
					     unsigned short port)
{
  struct sockaddr_in *new=(struct sockaddr_in *)
    malloc(sizeof( struct sockaddr_in ));
  bzero (new,sizeof(struct sockaddr_in));  
  host=host;
  bcopy (&host, &new->sin_addr, 4);
  new->sin_port = port; 
  new->sin_family = AF_INET;
  return(new);
}

struct sockaddr_in *make_sockaddr_in(char *hostname,char *service)
{
  struct hostent *he;
  unsigned long haddr=0;
  unsigned short port;
  struct sockaddr_in *new=(struct sockaddr_in *)
    malloc(sizeof( struct sockaddr_in ));

  memset(new,0,sizeof(struct sockaddr_in));  

  if (hostname){
    if (!(he=gethostbyname(hostname))){
      haddr=ipv4_addr_from_string(hostname);
    } else bcopy(he->h_addr,&haddr,4);
  }

#ifndef WIN32
  {
    struct servent *se;

    /* I hope these aren't important -ns */
    getservent(); 

    if (!(se=getservbyname(service,0))){
      port=(unsigned long)atol(service);
      if (!port) return(0);
    } else {
      port= se->s_port; 
    }
    endservent();  
  }
#else
  port=(unsigned short)atol(service);
#endif
  new->sin_family = AF_INET;
  /*  haddr=htonl(haddr);*/
  bcopy (&haddr, &new->sin_addr, 4);
  new->sin_port = htons(port); 
  return(new);
}

