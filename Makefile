# the overall project name
PROJECT_NAME := agha-aai-test-bed

# the main editable settings of the project - feel free to override on make invoke (i.e. make DEVELOPER_NAME=patto lambda)
# changing this allows multiple installations of the entire stack in a single AWS account
DEVELOPER_NAME := dev

AWS_DOMAIN := aai.dev.umccr.org
AWS_DOMAINZONE := Z08051723GLGZNT6G8DXW
AWS_AUSCERT := arn:aws:acm:ap-southeast-2:843407916570:certificate/479bfe83-07ca-4e16-8642-7d1444b97bc5


# test for the existence of any globally installed binaries we depend on
# setup language dependencies in all our folders
setup:
	which -s pipenv npx aws
	cd backend && npm install
	cd iac && npm install


# both our local and deploy stages don't actually do a real typescript compile - so this does
compile:
	cd backend && npx tsc --noEmit


# runs nodemon watching the source - for purely local dev work (needs local dynamodb etc)
runlocal:
	cd backend && npx cross-env NODE_ENV=development DYNAMO_ENDPOINT=http://localhost:3000 nodemon


# runs nodemon watching the source - for local dev work though using real AWS artifacts (see .env)
runaws:
	cd backend && npx cross-env NODE_ENV=development nodemon


# deploys via CDK to AWS
.PHONY: deploy
deploy:
	cd iac && UMCCR_DEVELOPER=$(DEVELOPER_NAME) npx cdk deploy --context build="$(DEVELOPER_NAME)" \
	   --parameters "SemanticVersion=0.0.0-$(DEVELOPER_NAME)" \
	   --parameters "AlbCertArn=$(AWS_AUSCERT)" \
	   --parameters "AlbNameHost=*" \
	   --parameters "AlbNameDomain=$(AWS_DOMAIN)" \
	   --parameters "AlbNameZoneId=$(AWS_DOMAINZONE)"


# undeploys via CDK
undeploy:
	cd iac && UMCCR_DEVELOPER=$(DEVELOPER_NAME) npx cdk destroy


clean:
	cd iac && rm -rf node_modules
	cd backend && rm -rf node_modules


.PHONY: setup compile runlocal runaws backend deploy undeploy
