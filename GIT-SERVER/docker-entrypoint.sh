#!/bin/bash
set -e 
#if [ -e /var/run/fcgiwrap.socket ] ; then 
    #rm /var/run/fcgiwrap.socket
#fi 



spawn-fcgi -s /var/run/fcgiwrap.socket -U nginx -G nginx /usdocr/sbin/fcgiwarp

nginx -g 'daemon off;'


