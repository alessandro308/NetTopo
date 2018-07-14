SUBDIRS = adt
noinst_PROGRAMS = check_ttl_hash
TESTS = check_ttl_hash
bin_PROGRAMS = ally @DBPROGS@
EXTRA_PROGRAMS = molly show_aliases recheck_aliases dumpcch
ally_SOURCES=ally.c ally_main.c
ally_LDADD = -L./adt -ladt -lgadt
ally_DEPENDENCIES = $(srcdir)/adt
molly_SOURCES=molly.c  ally.c alias_matrix.c alias_matrix.h ttl_hashtable.c ttl_hashtable.h commandline.c commandline.h
molly_LDADD = -L./adt -ladt -lgadt
molly_DEPENDENCIES = $(srcdir)/adt
show_aliases_SOURCES=show_aliases.c alias_matrix.c alias_matrix.h commandline.c commandline.h
show_aliases_LDADD = -L./adt -ladt -lgadt
show_aliases_DEPENDENCIES = $(srcdir)/adt
recheck_aliases_SOURCES=recheck_aliases.c alias_matrix.c alias_matrix.h commandline.c commandline.h ally.c ally.h
recheck_aliases_LDADD = -L./adt -ladt -lgadt
recheck_aliases_DEPENDENCIES = $(srcdir)/adt
dumpcch_SOURCES=dumpcch.c  commandline.c alias_matrix.c alias_matrix.h
dumpcch_LDADD = -L./adt -ladt -lgadt
dumpcch_DEPENDENCIES = $(srcdir)/adt
check_ttl_hash_SOURCES=check_ttl_hash.c ttl_hashtable.c
check_ttl_hash_LDADD = -L./adt -ladt -lgadt
check_ttl_hash_DEPENDENCIES = $(srcdir)/adt
AM_CFLAGS = -I$(srcdir)/adt -Iadt -I/usr/include/postgresql

EXTRA_DIST=ChangeLog doc

#  if you write a self-test script named `chk', uncomment the
#  following and add `chk' to the EXTRA_DIST list
#TESTS=chk

#cruft cruft cruft cruft cruft cruft cruft cruft cruft cruft
# use autoreconf -i to regenerate all of this crap.
MAINTAINERCLEANFILES = Makefile.in INSTALL config.guess config.sub depcomp \
	                   install-sh missing mkinstalldirs config.log config.cache \
	                   stamp-h.in aclocal.m4 config.h.in config.status configure \
	                   ChangeLog

MOSTLYCLEANFILES = *.lint

suid: all
	sudo chown root ./ally ./molly ./recheck_aliases
	sudo chmod u+s ./ally ./molly ./recheck_aliases

maintainer-clean-generic: distclean-generic
	-test -z "$(MAINTAINERCLEANFILES)" || rm -f $(MAINTAINERCLEANFILES)

# %.o in there to make sure the .c file's dependencies are tracked too.
# test $@ -nt $< || \

%.lint: %.c %.o
	@echo linting $<
	$(LINT) +posixlib -exportlocal $(AM_CFLAGS) $(DEFS) $(DEFAULT_INCLUDES) $< | tee $@ \
	|| rm $@

lint: $(patsubst %.c,%.lint,$(ally_SOURCES) $(molly_SOURCES))

ETAGS_ARGS=

dist-hook-local: ChangeLog

ChangeLog: configure Makefile.in Makefile.am
	@if [ -z "$(CVSCL)" ]; then \
	  echo cvs2cl is missing on your system, so no new ChangeLog for you; \
		touch ChangeLog; \
	else \
		$(CVSCL) -l "-d2001-10-15" -I .cvsignore --window 360 --prune; \
	   echo done with ChangeLog; \
	fi;

%.eps: %.jgr
	jgraph $< > $@
%.png: %.xpm
	convert $< $@
%.ps: %.jgr
	jgraph -P $< > $@

%.E: %.c
	$(CC) -E $(INCLUDES) $(DEFS) $(AM_CFLAGS) $< > $@

# not needed.
#routers.lst: MakeRoutersLst.sh
#	 ./MakeRoutersLst.sh

