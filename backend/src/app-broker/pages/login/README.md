This is a standalone login page - that has abilities to
be skinned / configured at the server end.

Basically we want to have a plausible nice login page - but really don't
want it to be a big deal _within_ our project (as in we don't want it
in the build chain etc we don't want to have Vuejs imported etc).

BTW IMPORTANT DETAIL - THE LOGIN PAGE PROBABLY DOESN'T NEED TO
USE PASSWORDS - THEY AREN'T ACTUALLY LOGGING IN TO ANYTHING!!

So this is just a Vuejs with no bundling - and
some magic in the backend to inject config.
