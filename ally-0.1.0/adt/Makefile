# Makefile.in generated automatically by automake 1.5 from Makefile.am.

# Copyright 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001
# Free Software Foundation, Inc.
# This Makefile.in is free software; the Free Software Foundation
# gives unlimited permission to copy and/or distribute it,
# with or without modifications, as long as this notice is preserved.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY, to the extent permitted by law; without
# even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.



SHELL = /bin/sh

srcdir = .
top_srcdir = ..

prefix = /usr/local
exec_prefix = ${prefix}

bindir = ${exec_prefix}/bin
sbindir = ${exec_prefix}/sbin
libexecdir = ${exec_prefix}/libexec
datadir = ${prefix}/share
sysconfdir = ${prefix}/etc
sharedstatedir = ${prefix}/com
localstatedir = ${prefix}/var
libdir = ${exec_prefix}/lib
infodir = ${prefix}/info
mandir = ${prefix}/man
includedir = ${prefix}/include
oldincludedir = /usr/include
pkgdatadir = $(datadir)/ally
pkglibdir = $(libdir)/ally
pkgincludedir = $(includedir)/ally
top_builddir = ..

ACLOCAL = ${SHELL} /ally/missing --run aclocal
AUTOCONF = ${SHELL} /ally/missing --run autoconf
AUTOMAKE = ${SHELL} /ally/missing --run automake
AUTOHEADER = ${SHELL} /ally/missing --run autoheader

INSTALL = /usr/bin/install -c
INSTALL_PROGRAM = ${INSTALL}
INSTALL_DATA = ${INSTALL} -m 644
INSTALL_SCRIPT = ${INSTALL}
INSTALL_HEADER = $(INSTALL_DATA)
transform = s,x,x,
NORMAL_INSTALL = :
PRE_INSTALL = :
POST_INSTALL = :
NORMAL_UNINSTALL = :
PRE_UNINSTALL = :
POST_UNINSTALL = :
host_alias = 
host_triplet = x86_64-unknown-linux-gnu
AMTAR = ${SHELL} /ally/missing --run tar
AWK = mawk
CC = gcc
CVSCL = 
DBPROGS = 
DEPDIR = .deps
DOT = 
EXEEXT = 
GETOPT_OBJ = 
GETOPT_SRC = 
INSTALL_STRIP_PROGRAM = ${SHELL} $(install_sh) -c -s
ISODATE = 2018-07-13
LINT = 
OBJEXT = o
PACKAGE = ally
RANLIB = ranlib
VERSION = 0.1.0
am__include = include
am__quote = 
install_sh = /ally/install-sh

noinst_PROGRAMS = test_eventqueue test_set check_si check_typed_hash check_string_bind bench-recursively
TESTS = check_si check_typed_hash check_string_bind
EXTRA_DIST = README neils_adt.m4

test_eventqueue_SOURCES = test_eventqueue.c eventqueue.h \
	eventqueue.c queue.c queue.h


test_set_SOURCES = test_set.c set.h set.c 

check_si_SOURCES = check_si.c
check_si_LDADD = libadt.a
check_typed_hash_SOURCES = check_typed_hash.c
check_typed_hash_LDADD = libadt.a
check_string_bind_SOURCES = check_string_bind.c
check_string_bind_LDADD = libadt.a

bench_recursively_SOURCES = bench-recursively.c
bench_recursively_LDADD = libadt.a

noinst_LIBRARIES = libadt.a libgadt.a

libadt_a_SOURCES = hashtable.c hashtable.h \
	typed_hashtable.h \
	queue.c queue.h \
	typed_queue.h \
	timeseries.c timeseries.h \
	eventqueue.c eventqueue.h \
	sprinter.c sprinter.h \
	hashes.c hashes.h \
	alert.c alert.h \
	hprop.c hprop.h \
	buffer.c buffer.h \
	table.c table.h \
	hpropinterface.c hpropinterface.h \
	sorted_intlist.c sorted_intlist.h \
	sorted_stringlist.c sorted_stringlist.h \
	red_transitive.c red_transitive.h \
	link_matrix.c link_matrix.h \
	disjoint_set.c disjoint_set.h \
	string_bindings.c string_bindings.h \
	progress.c progress.h \
	postgresql.c postgresql.h \
	distribution.c distribution.h \
	set.c set.h \
	join.c join.h \
	commando.c commando.h \
	recursively.c recursively.h \
	sockaddr.c  \
	snprintf.c \
	nscommon.h 

libadt_a_LIBADD = 
libadt_a_DEPENDENCIES = 

EXTRA_libadt_a_SOURCES = getopt.c getopt.h getopt1.c

libgadt_a_SOURCES = graphing_ts.c graphing_ts.h

INCLUDES = -I$(srcdir)/.. -I$(srcdir)
subdir = adt
mkinstalldirs = $(SHELL) $(top_srcdir)/mkinstalldirs
CONFIG_HEADER = $(top_builddir)/config.h
CONFIG_CLEAN_FILES =
LIBRARIES = $(noinst_LIBRARIES)

libadt_a_AR = $(AR) cru
am_libadt_a_OBJECTS = hashtable.$(OBJEXT) queue.$(OBJEXT) \
	timeseries.$(OBJEXT) eventqueue.$(OBJEXT) sprinter.$(OBJEXT) \
	hashes.$(OBJEXT) alert.$(OBJEXT) hprop.$(OBJEXT) \
	buffer.$(OBJEXT) table.$(OBJEXT) hpropinterface.$(OBJEXT) \
	sorted_intlist.$(OBJEXT) sorted_stringlist.$(OBJEXT) \
	red_transitive.$(OBJEXT) link_matrix.$(OBJEXT) \
	disjoint_set.$(OBJEXT) string_bindings.$(OBJEXT) \
	progress.$(OBJEXT) postgresql.$(OBJEXT) distribution.$(OBJEXT) \
	set.$(OBJEXT) join.$(OBJEXT) commando.$(OBJEXT) \
	recursively.$(OBJEXT) sockaddr.$(OBJEXT) snprintf.$(OBJEXT)
libadt_a_OBJECTS = $(am_libadt_a_OBJECTS)
libgadt_a_AR = $(AR) cru
libgadt_a_LIBADD =
am_libgadt_a_OBJECTS = graphing_ts.$(OBJEXT)
libgadt_a_OBJECTS = $(am_libgadt_a_OBJECTS)
noinst_PROGRAMS = test_eventqueue$(EXEEXT) test_set$(EXEEXT) \
	check_si$(EXEEXT) check_typed_hash$(EXEEXT) \
	check_string_bind$(EXEEXT) bench-recursively$(EXEEXT)
PROGRAMS = $(noinst_PROGRAMS)

am_bench_recursively_OBJECTS = bench-recursively.$(OBJEXT)
bench_recursively_OBJECTS = $(am_bench_recursively_OBJECTS)
bench_recursively_DEPENDENCIES = libadt.a
bench_recursively_LDFLAGS =
am_check_si_OBJECTS = check_si.$(OBJEXT)
check_si_OBJECTS = $(am_check_si_OBJECTS)
check_si_DEPENDENCIES = libadt.a
check_si_LDFLAGS =
am_check_string_bind_OBJECTS = check_string_bind.$(OBJEXT)
check_string_bind_OBJECTS = $(am_check_string_bind_OBJECTS)
check_string_bind_DEPENDENCIES = libadt.a
check_string_bind_LDFLAGS =
am_check_typed_hash_OBJECTS = check_typed_hash.$(OBJEXT)
check_typed_hash_OBJECTS = $(am_check_typed_hash_OBJECTS)
check_typed_hash_DEPENDENCIES = libadt.a
check_typed_hash_LDFLAGS =
am_test_eventqueue_OBJECTS = test_eventqueue.$(OBJEXT) \
	eventqueue.$(OBJEXT) queue.$(OBJEXT)
test_eventqueue_OBJECTS = $(am_test_eventqueue_OBJECTS)
test_eventqueue_LDADD = $(LDADD)
test_eventqueue_DEPENDENCIES =
test_eventqueue_LDFLAGS =
am_test_set_OBJECTS = test_set.$(OBJEXT) set.$(OBJEXT)
test_set_OBJECTS = $(am_test_set_OBJECTS)
test_set_LDADD = $(LDADD)
test_set_DEPENDENCIES =
test_set_LDFLAGS =

DEFS = -DHAVE_CONFIG_H
DEFAULT_INCLUDES =  -I. -I$(srcdir) -I$(top_builddir)
CPPFLAGS = 
LDFLAGS = 
LIBS = -lpthread 
depcomp = $(SHELL) $(top_srcdir)/depcomp
DEP_FILES = $(DEPDIR)/alert.Po \
	$(DEPDIR)/bench-recursively.Po $(DEPDIR)/buffer.Po \
	$(DEPDIR)/check_si.Po \
	$(DEPDIR)/check_string_bind.Po \
	$(DEPDIR)/check_typed_hash.Po $(DEPDIR)/commando.Po \
	$(DEPDIR)/disjoint_set.Po $(DEPDIR)/distribution.Po \
	$(DEPDIR)/eventqueue.Po $(DEPDIR)/getopt.Po \
	$(DEPDIR)/getopt1.Po $(DEPDIR)/graphing_ts.Po \
	$(DEPDIR)/hashes.Po $(DEPDIR)/hashtable.Po \
	$(DEPDIR)/hprop.Po $(DEPDIR)/hpropinterface.Po \
	$(DEPDIR)/join.Po $(DEPDIR)/link_matrix.Po \
	$(DEPDIR)/postgresql.Po $(DEPDIR)/progress.Po \
	$(DEPDIR)/queue.Po $(DEPDIR)/recursively.Po \
	$(DEPDIR)/red_transitive.Po $(DEPDIR)/set.Po \
	$(DEPDIR)/snprintf.Po $(DEPDIR)/sockaddr.Po \
	$(DEPDIR)/sorted_intlist.Po \
	$(DEPDIR)/sorted_stringlist.Po \
	$(DEPDIR)/sprinter.Po $(DEPDIR)/string_bindings.Po \
	$(DEPDIR)/table.Po $(DEPDIR)/test_eventqueue.Po \
	$(DEPDIR)/test_set.Po $(DEPDIR)/timeseries.Po
COMPILE = $(CC) $(DEFS) $(DEFAULT_INCLUDES) $(INCLUDES) $(AM_CPPFLAGS) \
	$(CPPFLAGS) $(AM_CFLAGS) $(CFLAGS)
CCLD = $(CC)
LINK = $(CCLD) $(AM_CFLAGS) $(CFLAGS) $(AM_LDFLAGS) $(LDFLAGS) -o $@
CFLAGS = -g -O2
DIST_SOURCES = $(libadt_a_SOURCES) $(EXTRA_libadt_a_SOURCES) \
	$(libgadt_a_SOURCES) $(bench_recursively_SOURCES) \
	$(check_si_SOURCES) $(check_string_bind_SOURCES) \
	$(check_typed_hash_SOURCES) $(test_eventqueue_SOURCES) \
	$(test_set_SOURCES)
DIST_COMMON = README Makefile.am Makefile.in
SOURCES = $(libadt_a_SOURCES) $(EXTRA_libadt_a_SOURCES) $(libgadt_a_SOURCES) $(bench_recursively_SOURCES) $(check_si_SOURCES) $(check_string_bind_SOURCES) $(check_typed_hash_SOURCES) $(test_eventqueue_SOURCES) $(test_set_SOURCES)

all: all-am

.SUFFIXES:
.SUFFIXES: .c .o .obj
$(srcdir)/Makefile.in:  Makefile.am  $(top_srcdir)/configure.in $(ACLOCAL_M4)
	cd $(top_srcdir) && \
	  $(AUTOMAKE) --gnu  adt/Makefile
Makefile:  $(srcdir)/Makefile.in  $(top_builddir)/config.status
	cd $(top_builddir) && \
	  CONFIG_HEADERS= CONFIG_LINKS= \
	  CONFIG_FILES=$(subdir)/$@ $(SHELL) ./config.status

AR = ar

clean-noinstLIBRARIES:
	-test -z "$(noinst_LIBRARIES)" || rm -f $(noinst_LIBRARIES)
libadt.a: $(libadt_a_OBJECTS) $(libadt_a_DEPENDENCIES) 
	-rm -f libadt.a
	$(libadt_a_AR) libadt.a $(libadt_a_OBJECTS) $(libadt_a_LIBADD)
	$(RANLIB) libadt.a
libgadt.a: $(libgadt_a_OBJECTS) $(libgadt_a_DEPENDENCIES) 
	-rm -f libgadt.a
	$(libgadt_a_AR) libgadt.a $(libgadt_a_OBJECTS) $(libgadt_a_LIBADD)
	$(RANLIB) libgadt.a

clean-noinstPROGRAMS:
	-test -z "$(noinst_PROGRAMS)" || rm -f $(noinst_PROGRAMS)
bench-recursively$(EXEEXT): $(bench_recursively_OBJECTS) $(bench_recursively_DEPENDENCIES) 
	@rm -f bench-recursively$(EXEEXT)
	$(LINK) $(bench_recursively_LDFLAGS) $(bench_recursively_OBJECTS) $(bench_recursively_LDADD) $(LIBS)
check_si$(EXEEXT): $(check_si_OBJECTS) $(check_si_DEPENDENCIES) 
	@rm -f check_si$(EXEEXT)
	$(LINK) $(check_si_LDFLAGS) $(check_si_OBJECTS) $(check_si_LDADD) $(LIBS)
check_string_bind$(EXEEXT): $(check_string_bind_OBJECTS) $(check_string_bind_DEPENDENCIES) 
	@rm -f check_string_bind$(EXEEXT)
	$(LINK) $(check_string_bind_LDFLAGS) $(check_string_bind_OBJECTS) $(check_string_bind_LDADD) $(LIBS)
check_typed_hash$(EXEEXT): $(check_typed_hash_OBJECTS) $(check_typed_hash_DEPENDENCIES) 
	@rm -f check_typed_hash$(EXEEXT)
	$(LINK) $(check_typed_hash_LDFLAGS) $(check_typed_hash_OBJECTS) $(check_typed_hash_LDADD) $(LIBS)
test_eventqueue$(EXEEXT): $(test_eventqueue_OBJECTS) $(test_eventqueue_DEPENDENCIES) 
	@rm -f test_eventqueue$(EXEEXT)
	$(LINK) $(test_eventqueue_LDFLAGS) $(test_eventqueue_OBJECTS) $(test_eventqueue_LDADD) $(LIBS)
test_set$(EXEEXT): $(test_set_OBJECTS) $(test_set_DEPENDENCIES) 
	@rm -f test_set$(EXEEXT)
	$(LINK) $(test_set_LDFLAGS) $(test_set_OBJECTS) $(test_set_LDADD) $(LIBS)

mostlyclean-compile:
	-rm -f *.$(OBJEXT) core *.core

distclean-compile:
	-rm -f *.tab.c

include $(DEPDIR)/alert.Po
include $(DEPDIR)/bench-recursively.Po
include $(DEPDIR)/buffer.Po
include $(DEPDIR)/check_si.Po
include $(DEPDIR)/check_string_bind.Po
include $(DEPDIR)/check_typed_hash.Po
include $(DEPDIR)/commando.Po
include $(DEPDIR)/disjoint_set.Po
include $(DEPDIR)/distribution.Po
include $(DEPDIR)/eventqueue.Po
include $(DEPDIR)/getopt.Po
include $(DEPDIR)/getopt1.Po
include $(DEPDIR)/graphing_ts.Po
include $(DEPDIR)/hashes.Po
include $(DEPDIR)/hashtable.Po
include $(DEPDIR)/hprop.Po
include $(DEPDIR)/hpropinterface.Po
include $(DEPDIR)/join.Po
include $(DEPDIR)/link_matrix.Po
include $(DEPDIR)/postgresql.Po
include $(DEPDIR)/progress.Po
include $(DEPDIR)/queue.Po
include $(DEPDIR)/recursively.Po
include $(DEPDIR)/red_transitive.Po
include $(DEPDIR)/set.Po
include $(DEPDIR)/snprintf.Po
include $(DEPDIR)/sockaddr.Po
include $(DEPDIR)/sorted_intlist.Po
include $(DEPDIR)/sorted_stringlist.Po
include $(DEPDIR)/sprinter.Po
include $(DEPDIR)/string_bindings.Po
include $(DEPDIR)/table.Po
include $(DEPDIR)/test_eventqueue.Po
include $(DEPDIR)/test_set.Po
include $(DEPDIR)/timeseries.Po

distclean-depend:
	-rm -rf $(DEPDIR)

.c.o:
	source='$<' object='$@' libtool=no \
	depfile='$(DEPDIR)/$*.Po' tmpdepfile='$(DEPDIR)/$*.TPo' \
	$(CCDEPMODE) $(depcomp) \
	$(COMPILE) -c `test -f $< || echo '$(srcdir)/'`$<

.c.obj:
	source='$<' object='$@' libtool=no \
	depfile='$(DEPDIR)/$*.Po' tmpdepfile='$(DEPDIR)/$*.TPo' \
	$(CCDEPMODE) $(depcomp) \
	$(COMPILE) -c `cygpath -w $<`
CCDEPMODE = depmode=gcc3
uninstall-info-am:

tags: TAGS

ID: $(HEADERS) $(SOURCES) $(LISP) $(TAGS_FILES)
	list='$(SOURCES) $(HEADERS) $(TAGS_FILES)'; \
	unique=`for i in $$list; do \
	    if test -f "$$i"; then echo $$i; else echo $(srcdir)/$$i; fi; \
	  done | \
	  $(AWK) '    { files[$$0] = 1; } \
	       END { for (i in files) print i; }'`; \
	mkid -fID $$unique $(LISP)

TAGS:  $(HEADERS) $(SOURCES)  $(TAGS_DEPENDENCIES) \
		$(TAGS_FILES) $(LISP)
	tags=; \
	here=`pwd`; \
	list='$(SOURCES) $(HEADERS) $(TAGS_FILES)'; \
	unique=`for i in $$list; do \
	    if test -f "$$i"; then echo $$i; else echo $(srcdir)/$$i; fi; \
	  done | \
	  $(AWK) '    { files[$$0] = 1; } \
	       END { for (i in files) print i; }'`; \
	test -z "$(ETAGS_ARGS)$$unique$(LISP)$$tags" \
	  || etags $(ETAGS_ARGS) $$tags  $$unique $(LISP)

GTAGS:
	here=`CDPATH=: && cd $(top_builddir) && pwd` \
	  && cd $(top_srcdir) \
	  && gtags -i $(GTAGS_ARGS) $$here

distclean-tags:
	-rm -f TAGS ID GTAGS GRTAGS GSYMS GPATH

check-TESTS: $(TESTS)
	@failed=0; all=0; xfail=0; xpass=0; \
	srcdir=$(srcdir); export srcdir; \
	list='$(TESTS)'; \
	if test -n "$$list"; then \
	  for tst in $$list; do \
	    if test -f ./$$tst; then dir=./; \
	    elif test -f $$tst; then dir=; \
	    else dir="$(srcdir)/"; fi; \
	    if $(TESTS_ENVIRONMENT) $${dir}$$tst; then \
	      all=`expr $$all + 1`; \
	      case " $(XFAIL_TESTS) " in \
	      *" $$tst "*) \
	        xpass=`expr $$xpass + 1`; \
	        failed=`expr $$failed + 1`; \
	        echo "XPASS: $$tst"; \
	      ;; \
	      *) \
	        echo "PASS: $$tst"; \
	      ;; \
	      esac; \
	    elif test $$? -ne 77; then \
	      all=`expr $$all + 1`; \
	      case " $(XFAIL_TESTS) " in \
	      *" $$tst "*) \
	        xfail=`expr $$xfail + 1`; \
	        echo "XFAIL: $$tst"; \
	      ;; \
	      *) \
	        failed=`expr $$failed + 1`; \
	        echo "FAIL: $$tst"; \
	      ;; \
	      esac; \
	    fi; \
	  done; \
	  if test "$$failed" -eq 0; then \
	    if test "$$xfail" -eq 0; then \
	      banner="All $$all tests passed"; \
	    else \
	      banner="All $$all tests behaved as expected ($$xfail expected failures)"; \
	    fi; \
	  else \
	    if test "$$xpass" -eq 0; then \
	      banner="$$failed of $$all tests failed"; \
	    else \
	      banner="$$failed of $$all tests did not behave as expected ($$xpass unexpected passes)"; \
	    fi; \
	  fi; \
	  dashes=`echo "$$banner" | sed s/./=/g`; \
	  echo "$$dashes"; \
	  echo "$$banner"; \
	  echo "$$dashes"; \
	  test "$$failed" -eq 0; \
	fi

DISTFILES = $(DIST_COMMON) $(DIST_SOURCES) $(TEXINFOS) $(EXTRA_DIST)

top_distdir = ..
distdir = $(top_distdir)/$(PACKAGE)-$(VERSION)

distdir: $(DISTFILES)
	@for file in $(DISTFILES); do \
	  if test -f $$file; then d=.; else d=$(srcdir); fi; \
	  dir=`echo "$$file" | sed -e 's,/[^/]*$$,,'`; \
	  if test "$$dir" != "$$file" && test "$$dir" != "."; then \
	    $(mkinstalldirs) "$(distdir)/$$dir"; \
	  fi; \
	  if test -d $$d/$$file; then \
	    cp -pR $$d/$$file $(distdir) \
	    || exit 1; \
	  else \
	    test -f $(distdir)/$$file \
	    || cp -p $$d/$$file $(distdir)/$$file \
	    || exit 1; \
	  fi; \
	done
check-am: all-am
	$(MAKE) $(AM_MAKEFLAGS) check-TESTS
check: check-am
all-am: Makefile $(LIBRARIES) $(PROGRAMS)

installdirs:

install: install-am
install-exec: install-exec-am
install-data: install-data-am
uninstall: uninstall-am

install-am: all-am
	@$(MAKE) $(AM_MAKEFLAGS) install-exec-am install-data-am

installcheck: installcheck-am
install-strip:
	$(MAKE) $(AM_MAKEFLAGS) INSTALL_PROGRAM="$(INSTALL_STRIP_PROGRAM)" \
	  `test -z '$(STRIP)' || \
	    echo "INSTALL_PROGRAM_ENV=STRIPPROG='$(STRIP)'"` install
mostlyclean-generic:

clean-generic:

distclean-generic:
	-rm -f Makefile $(CONFIG_CLEAN_FILES) stamp-h stamp-h[0-9]*

maintainer-clean-generic:
	@echo "This command is intended for maintainers to use"
	@echo "it deletes files that may require special tools to rebuild."
clean: clean-am

clean-am: clean-generic clean-noinstLIBRARIES clean-noinstPROGRAMS \
	mostlyclean-am

distclean: distclean-am

distclean-am: clean-am distclean-compile distclean-depend \
	distclean-generic distclean-tags

dvi: dvi-am

dvi-am:

info: info-am

info-am:

install-data-am:

install-exec-am:

install-info: install-info-am

install-man:

installcheck-am:

maintainer-clean: maintainer-clean-am

maintainer-clean-am: distclean-am maintainer-clean-generic

mostlyclean: mostlyclean-am

mostlyclean-am: mostlyclean-compile mostlyclean-generic

uninstall-am: uninstall-info-am

.PHONY: GTAGS all all-am check check-TESTS check-am clean clean-generic \
	clean-noinstLIBRARIES clean-noinstPROGRAMS distclean \
	distclean-compile distclean-depend distclean-generic \
	distclean-tags distdir dvi dvi-am info info-am install \
	install-am install-data install-data-am install-exec \
	install-exec-am install-info install-info-am install-man \
	install-strip installcheck installcheck-am installdirs \
	maintainer-clean maintainer-clean-generic mostlyclean \
	mostlyclean-compile mostlyclean-generic tags uninstall \
	uninstall-am uninstall-info-am


%.lint: %.c Makefile .lclintrc
	$(LINT) +unixlib -exportlocal $(AM_CFLAGS) $(DEFS) $(DEFAULT_INCLUDES) $< | tee $@

%.E: %.c
	$(CC) -E $(INCLUDES) $(DEFS) $< > $@
# Tell versions [3.59,3.63) of GNU make to not export all variables.
# Otherwise a system limit (for SysV at least) may be exceeded.
.NOEXPORT:
