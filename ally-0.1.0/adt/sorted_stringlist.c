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

#include <config.h>
#include "sorted_stringlist.h"
#include "queue.h"
#include <stdlib.h>
#include <assert.h>
#include <string.h>

#ifdef WITH_DMALLOC
#include <dmalloc.h>
#endif

struct sorted_stringlist_struct {
  queue q;
};

sorted_stringlist ss_new(void) {
  sorted_stringlist ss = (sorted_stringlist) malloc(sizeof(struct sorted_stringlist_struct));
  ss->q = q_new(q_strcmp, free);
  return(ss);
}

void ss_delete(/*@only@*/ sorted_stringlist ss) {
  assert(ss != NULL);
  assert(ss->q != NULL);
  q_delete(ss->q);
  free(ss);
}

void ss_insert(sorted_stringlist ss, const char * to_insert) {
  q_insert(ss->q, (void *)to_insert);
}
void ss_append(sorted_stringlist ss, const char * to_append) {
  q_append(ss->q, (void *)to_append);
}

boolean si_iterate(sorted_stringlist ss, 
                   boolean (*iterator)(const char *value, void *user),
                   void *user) {
  return q_iterate(ss->q, (q_iterator)iterator, user);
}

unsigned long ss_length(sorted_stringlist ss) {
  return(q_length(ss->q));
}

boolean ss_member(sorted_stringlist ss, const char * value) {
  return(q_find(ss->q, (const void *)value) != 0);
}

static boolean stringprint(const void *stringvalue, void* file){ 
  FILE *fpout = (FILE *)file;
  const char * value = (const char *) stringvalue;
  fprintf(fpout, "%s ", value);
  return TRUE;
}

void ss_print(sorted_stringlist ss, FILE *fpout) {
  q_iterate(ss->q, stringprint, fpout);
  fprintf(fpout, "\n");
}
