# Use the official Debian image
FROM debian:12.9

# Set environment variables for Git over HTTP
ENV GIT_PROJECT_ROOT=/srv/git
ENV GIT_HTTP_EXPORT_ALL=1
ENV REMOTE_USER=git
ENV GIT_ALLOW_PUSH=1


RUN apt-get update && \
    apt-get install -y apache2 apache2-utils git && \
    apt-get clean

# Fix Apache environment file (use Bash syntax)
RUN echo 'export APACHE_PID_FILE=/var/run/apache2/apache2.pid' >> /etc/apache2/envvars && \
    echo 'export GIT_PROJECT_ROOT=/srv/git' >> /etc/apache2/envvars && \
    echo 'export GIT_HTTP_EXPORT_ALL=1' >> /etc/apache2/envvars && \
    echo 'export REMOTE_USER=git' >> /etc/apache2/envvars && \
    echo 'export GIT_ALLOW_PUSH=1' >> /etc/apache2/envvars

# Copy Apache configuration
COPY git.conf /etc/apache2/sites-available/000-default.conf

# Enable necessary Apache modules
RUN a2enmod cgi alias env

aEXPOSE 80

# Start Apache using "service" command
CMD ["sh", "-c", "service apache2 start && tail -F /var/log/apache2/access.log /var/log/apache2/error.log"]
