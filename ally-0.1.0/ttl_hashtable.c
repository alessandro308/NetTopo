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
#include "nscommon.h"
#include "typed_hashtable.h"
#include "ttl_hashtable.h"

struct ttl_binding_st {
  struct in_addr addr;
  unsigned char ttl; /* could be a list of seen ttls, but I don't care
                        about that yet.  */
};

DECLARE_TYPED_HASHTABLE(struct ttl_binding_st, ttl);

ttl_hashtable th;

unsigned int 
hash_ttl_binding(const struct ttl_binding_st *p) {
  return(p->addr.s_addr);
}

boolean
isequal_ttl_binding(const struct ttl_binding_st *a, 
                    const struct ttl_binding_st *b) {
  if(a->addr.s_addr == b->addr.s_addr) 
    return(TRUE);
  return(FALSE);
}
   
void 
ttl_insert(struct in_addr addr, unsigned char ttl) {
  struct ttl_binding_st *p;
  if(th == NULL) 
    th = ttl_ht_new(3000, hash_ttl_binding, 
                    isequal_ttl_binding, (ttl_ht_delete_cb)free);
  
  p=ttl_ht_lookup(th, (struct ttl_binding_st *)&addr);
  if(p) 
    p->ttl = ttl;
  else {
    p=malloc(sizeof(struct ttl_binding_st));
    assert(p!=NULL);
    p->addr = addr;
    p->ttl = ttl;
    ttl_ht_insert(th, p);
  }
}

unsigned char 
ttl_for_ip(struct in_addr addr) {
  struct ttl_binding_st *p;
  if(th == NULL) return(0);
  p=ttl_ht_lookup(th, (struct ttl_binding_st *)&addr);
  if(p== NULL) return(0);
  return(p->ttl);
}



