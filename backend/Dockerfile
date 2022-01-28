# NOTE: super IMPORTANT!
# Because this docker lives at the root of a collection of projects - and we may have various points
# where those projects have folders with large files/lots of files - the .dockerignore is set by
# default to IGNORE ALL FILES.
# That is - each and every file/folder you want to be visible here for ADDing must be explicitly
# white listed in the .dockerignore.

FROM amazon/aws-lambda-nodejs:14

# Create this in / which is the location for the other entrypoint scripts provided by AWS
# This allows shell control signals to work when running the Docker image in a shell
# It is only used if running the lambda Docker locally for testing
RUN printf "#!/bin/bash\n$@\n" > /docker-entrypoint.sh

# NOTE: the default WORKDIR for the lambda images is /var/task which we inherit
# So all of these files are going into /var/task
COPY src/favicon.ico ./

# Try to be reasonably strict here about only install the needed node_modules for runtime ('ci --production', not '--dev')
COPY package*.json ./
RUN npm ci --production

COPY build ./
