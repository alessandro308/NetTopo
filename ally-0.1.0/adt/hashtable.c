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
#ifdef HAVE_LIBPTHREAD
#include <pthread.h>
#else 
typedef void *pthread_mutex_t;
#define pthread_mutex_lock(x) (0)
#define pthread_mutex_unlock(x) (0)
#define pthread_mutex_init(x,y) (0)
#define pthread_mutex_destroy(x) (0)
#endif
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <stdio.h>
#include "hashtable.h"
#include "progress.h"
#ifdef WITH_DMALLOC
#include <dmalloc.h>
#endif

typedef struct hashentry_struct {
  struct hashentry_struct *next;
  unsigned int hashkey;
  const void *keyval;
} hashentry;

struct hashtable_struct {
  hashentry **table;
  unsigned int table_size;
  unsigned int (*hash)(const void *key);
  boolean (*isequal)(const void *key1, const void *key2);
  /*@null@*/ void (*free_keyval)(void *key);
#ifdef _REENTRANT
  pthread_mutex_t mutex;
#endif
};

hashtable ht_new(unsigned int size, 
                 unsigned int (*hash)(const void *key),
                 boolean (*isequal)(const void *key1, 
                                    const void *key2),
                 void (*free_keyval)(void *key)) {
  hashtable ht = malloc(sizeof(struct hashtable_struct));
  assert(ht!=NULL);
  ht->table = (hashentry **)malloc(sizeof(hashentry *)*size);
  assert(ht->table!=NULL);
  memset(ht->table, 0, size * sizeof(hashentry *));   
  ht->table_size = size;
  ht->hash = hash;
  ht->isequal = isequal;
  ht->free_keyval = free_keyval;
#ifdef _REENTRANT
  (void)pthread_mutex_init(&ht->mutex, NULL);
#endif
  return(ht);
}

#ifdef _REENTRANT
#define LOCK assert(pthread_mutex_lock(&ht->mutex)==0)
#define UNLOCK assert(pthread_mutex_unlock(&ht->mutex)==0)
#else
#define LOCK do { } while(0)
#define UNLOCK do { } while(0)
#endif

void ht_insert(hashtable ht, const void *keyval) {
  hashentry *he;
  assert(ht!=NULL);
  he = malloc(sizeof(hashentry));
  assert(he!=NULL);
  he->hashkey = ht->hash(keyval);
  he->keyval = keyval;
  LOCK;
  he->next = ht->table[he->hashkey%ht->table_size];
  ht->table[he->hashkey%ht->table_size] = he;
  UNLOCK;
}

void ht_free_entry(hashtable ht, const void *keyval) {
  if(ht->free_keyval!= NULL)
    ht->free_keyval((void *)keyval);
}

void ht_delete(/*@only@*/ hashtable ht, boolean show_progress) {
  unsigned int i;
  if(show_progress) { 
    progress_label("ht_delete");
    progress_reset();
  }
  LOCK;
  for(i=0; i<ht->table_size; i++) {
    hashentry *he = ht->table[i];
    hashentry *prvhe;
    if(show_progress && (i % 100)==0) 
      progress((float)i / (float)ht->table_size);
    while(he) {
      ht_free_entry(ht, he->keyval);
      prvhe = he;
      he=he->next;
      free(prvhe);
    }
  }
  UNLOCK;
  if(show_progress)
    progress(1.0);
  free(ht->table);
  free(ht);
}

void ht_remove(hashtable ht, const void *key) {
  unsigned int hkey;
  hashentry *he, *prehe;
  assert(ht!=NULL);
  hkey = ht->hash(key);
  prehe = NULL;
  LOCK;
  he = ht->table[hkey%ht->table_size];
  while(he!=NULL) {
    if(he->hashkey == hkey && ht->isequal(he->keyval,key)) {
      if(prehe != NULL) {
        prehe->next = he->next;
      } else {
        ht->table[hkey%ht->table_size] = he->next;
      }
      UNLOCK;
      free(he);
      return;
    }
    prehe = he;
    he = he->next;
  }
  UNLOCK;
  return;
}
void *ht_lookup(hashtable ht,
                      const void *key) {
  unsigned int hkey;
  hashentry *he;
  assert(ht!=NULL);
  hkey = ht->hash(key);
  LOCK;
  he = ht->table[hkey%ht->table_size];
  while(he!=NULL) {
    if(he->hashkey == hkey && ht->isequal(he->keyval,key)) {
      UNLOCK;
      return((void *)he->keyval);
    }
    he = he->next;
  }
  UNLOCK;
  return NULL;
}


/*@dependent@*/ 
void *ht_lookup_nofail(hashtable ht, 
                             const void *key,
                             ht_constructor_cb constructor) {
  void *ret = ht_lookup(ht, key);
  if(ret == NULL) {
    ret = constructor(key);
    if(ret != NULL) {
      ht_insert(ht,ret);
    }
  }
  return(ret);
}

boolean ht_iterate(hashtable ht,
                   boolean (*callback)(const void *keyval, void *user), 
                   void *user) {
  unsigned int i;
  boolean cont = TRUE;
  if(ht == NULL) return FALSE;
  LOCK;
  for(i=0; i<ht->table_size && cont; i++) {
    hashentry *he = ht->table[i];
    while(he && cont) {
      cont = callback(he->keyval, user);
      he=he->next;
    }
  }
  UNLOCK;
  return cont;
}


void ht_occupancyjgr(const hashtable ht, const char *fname) {
  unsigned int i;
  int hist[101];
  FILE *fp;
  fp=fopen(fname,"w");
  if(fp != NULL) {
    memset(hist,0,sizeof(hist));
    for(i=0;i<ht->table_size; i++) {
      const hashentry *he = ht->table[i];
      int c;
      for(c=0; he!= NULL;  he=he->next, c++);
      hist[min(c,100)] ++;
    }
    fprintf(fp, "newgraph xaxis label : length of chain\n"
            "yaxis label : number of chains\n"
            "newcurve pts\n");
    for(i=0;i<=100;i++) {
      fprintf(fp, "%u %d\n", i, hist[i]);
    }
    fclose(fp);
  }
}

unsigned int hash_8byte(const void *k) {
  unsigned int a = *(const unsigned int *)k;
  unsigned int b = *(const unsigned int *)k+1;
  return(a*b);
}
boolean isequal_8byte(const void *ia, const void *ib) {
  int a = *(int *)ia, b = *(int*)ib;
  int a2 = *((int *)ia+1), b2 = *((int*)ib+1);
  return(a==b && a2==b2);
}

unsigned int hash_int(const void *k) {
  unsigned int a = *(const unsigned int *)k;
  return(a);
}

boolean isequal_int(const void *ia, const void *ib) {
  int a = *(int *)ia, b = *(int*)ib;
  return(a==b);
}

unsigned int hash_ushort(const void *k) {
  unsigned short a = *(const unsigned short *)k;
  return(a);
}

boolean isequal_ushort(const void *ia, const void *ib) {
  unsigned short a = *(const unsigned short *)ia; 
  unsigned short b = *(const unsigned short *)ib;
  return(a==b);
}


static boolean counter(const void *v __attribute__ ((unused)),
                       void *count) {
  (*(unsigned long *)count)++;
  assert((*(unsigned long *)count) < 200000);
  return TRUE;
}
unsigned long ht_count(hashtable ht) {
  unsigned long count=0;
  if(ht!=NULL) 
    (void)ht_iterate(ht, counter, &count);
  return count;
}

