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
#include <stdlib.h> 
#include <stdio.h> 
#include <getopt.h> 
#include <string.h> 
#include "commandline.h"
#include "nscommon.h"

#if ENABLE_NLS
# include <libintl.h>
# define _(Text) gettext (Text)
#else
# undef bindtextdomain
# define bindtextdomain(Domain, Directory) /* empty */
# undef textdomain
# define textdomain(Domain) /* empty */
# define _(Text) Text
#endif

/*@exits@*/
static void usage (int status, const char *program_name);

static struct option const long_options[] = {
  {"verbose", no_argument, 0, (int) 'v'},
  {"help",    no_argument, 0, (int) 'h'},
  {"version", no_argument, 0, (int) 'V'},
  {"limit",   required_argument, 0, (int) 'l'},
  {"file",    required_argument, 0, (int) 'f'},
  {"target_asn", required_argument, 0, (int) 't'},
  {"jgr_output", required_argument, 0, (int) 'j'},
  {"xpm_output", required_argument, 0, (int) 'x'},
  {"force", no_argument, 0, 0 },
  {"sk", no_argument, 0, (int) 's'},
  {NULL, 0, NULL, 0}
};

/* Set all the option flags according to the switches specified.
   Return the index of the first non-option argument.  */

unsigned short target_asn;
char target_asname[100];
boolean want_verbose;
boolean want_force;
boolean want_sk;
char *jgr_output;
char *xpm_output;
char *aux_filename;

int
decode_switches (int argc, char **argv)
{
  int c;
  int option_index;

  while ((c = getopt_long (argc, argv, 
                           "v"	/* verbose */
                           "h"	/* help */
                           "t:"	/* target asn */
                           "j:"	/* jgr output */
                           "x:"	/* xpm output */
                           "f:"	/* auxiliary file input */
                           "s"	/* skitter */
                           "V",	/* version */
                           long_options, &option_index)) != EOF) {
    switch (c) {
    case 0:
      if(strcmp(long_options[option_index].name, "force") == 0) {
        want_force = TRUE;
      }
      break;
    case 't':		/* --target_asn */
      {
        unsigned int tmp;
        if(sscanf(optarg, "%u:%s", &tmp, target_asname) == 0) {
          printf ("target as is an asn:fragment pair.\n");
          exit(EXIT_FAILURE);
        }
        target_asn = (unsigned short)tmp;
      }
      break;
    case 'j': /* jgr output, for show_aliases... */
      jgr_output = strdup(optarg);
      break;
    case 'x': /* xpm output, for show_aliases... */
      xpm_output = strdup(optarg);
      break;
    case 'l':		
      printf("-l unimplemented. use limit cputime\n");
      break;
    case 'v':		/* --verbose */
      want_verbose = TRUE;
      break;
    case 'f':		/* --verbose */
      aux_filename = strdup(optarg);
      break;
    case 's':		/* --sk */
      want_sk = TRUE;
      break;
    case 'V':
      printf ("alias resolution package version %s\n", VERSION);
      exit (0);
    case 'h':
      usage (0, argv[0]);

    default:
      usage (EXIT_FAILURE, argv[0]);
    }
  }
  
  return optind;
}


/*@exits@*/
static void
usage (int status, const char *program_name) {
  printf (_("%s - \
Task master\n"), program_name);
  printf (_("Usage: %s [OPTION]... [FILE]...\n"), program_name);
  printf (_("\
Options:\n\
  --verbose                     print more information\n\
  -h, --help                    display this help and exit\n\
  -V, --version                 output version information and exit\n\
  -l, --limit                   Limit execution duration to 2 hours\n\
  -t, --target_asn [AS-number]  AS being mapped\n\
  -j, --jgr_output jgrfile      pretty ugly, imho\n\
  -x, --xpm_output xpmfile      then use convert to get a real image format\n\
  -s, --sk                      merge with routersASsk from skitter\n\
  -f, --file filename           list of ip name pairs to add into alias reduction.\n\
"));
  exit (status);
}
