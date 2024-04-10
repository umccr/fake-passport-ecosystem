# the main editable settings of the project - feel free to override on make invoke (i.e. make DEVELOPER_NAME=patto lambda)
# changing this allows multiple installations of the entire stack in a single AWS account
DEVELOPER_NAME := dev

# test for the existence of any globally installed binaries we depend on
# setup language dependencies in all our folders
setup:
	which -s npx aws
	cd backend && npm install
	cd iac && npm install


# both our local and deploy stages don't actually do a real typescript compile - so this does
compile:
	cd backend && npx tsc --noEmit
	cd iac && npx tsc --noEmit


# runs nodemon watching the source - for purely local dev work (needs local dynamodb etc)
runlocal:
	cd backend && npx cross-env NODE_ENV=development DYNAMO_ENDPOINT=http://localhost:3000 nodemon


# runs while watching the source - for local dev work though using real AWS artifacts (see .env)
runaws:
	cd backend && npx cross-env NODE_ENV=development tsx watch --env-file=.env src/bootstrap-local.ts


# deploys via CDK to AWS
deploy-umccr-dev:
	cd iac && UMCCR_DEVELOPER=$(DEVELOPER_NAME) npx cdk deploy --context build="$(DEVELOPER_NAME)" \
	   --parameters "SemanticVersion=0.0.0-$(DEVELOPER_NAME)" \
	   --parameters "AlbNameDomain=aai.dev.umccr.org" \
	   --parameters "AlbNameZoneId=Z08051723GLGZNT6G8DXW" \
	   --parameters "AlbCertArn=arn:aws:acm:ap-southeast-2:843407916570:certificate/479bfe83-07ca-4e16-8642-7d1444b97bc5" \
	   --parameters "AlbNameHost=*"


# undeploys via CDK
undeploy:
	cd iac && UMCCR_DEVELOPER=$(DEVELOPER_NAME) npx cdk destroy


clean:
	cd iac && rm -rf node_modules
	cd backend && rm -rf node_modules


.PHONY: setup compile runlocal runaws backend deploy undeploy
