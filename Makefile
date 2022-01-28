# the master project name
PROJECT_NAME := aai-test-bed

# the main editable settings of the project - feel free to override on make invoke (i.e. make DEVELOPER_NAME=patto lambda)
# changing this allows multiple installations of the entire stack in a single AWS account
DEVELOPER_NAME := dev

# the AWS setup for UMCCR - change for deployment in other AWS envs (though probably needs changes in IAC/CDK too)
REPO_NAME := 843407916570.dkr.ecr.ap-southeast-2.amazonaws.com/$(PROJECT_NAME)-dev

AWS_DOMAIN := aai.nagim.dev
AWS_DOMAINZONE := Z0321813PLMQECK916W2
AWS_AUSCERT := arn:aws:acm:ap-southeast-2:843407916570:certificate/fa4885fb-5765-4fe6-9341-47fca360735e


BACKEND_SOURCE := backend/src
BACKEND_BUNDLE_JS := backend/build/bootstrap-lambda.js
BACKEND_MODULES := backend/node_modules

DOCKER_IMAGE := $(REPO_NAME):$(DEVELOPER_NAME)

TS_SRC := ${shell find $(BACKEND_SOURCE) -name '*.ts'}

# test for the existence of any globally installed binaries we depend on
# setup language dependencies in all our folders
setup:
	which -s pipenv npx aws
	cd backend && npm install
	cd iac && npm install
	cd client && pipenv install


all: backend

backend:
	cd backend && npm run build

backend-local:
	cd backend && npm run dev

backend-image: backend
	cd backend && docker build -t $(DOCKER_IMAGE) .

backend-image-deploy: backend-image
	aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin $(REPO_NAME)
	docker push $(DOCKER_IMAGE)

deploy:
	cd iac && UMCCR_DEVELOPER=$(DEVELOPER_NAME) npx cdk deploy --toolkit-stack-name CDKToolkitNew --context build="$(DEVELOPER_NAME)" \
	   --parameters "SemanticVersion=0.0.0-$(DEVELOPER_NAME)" \
	   --parameters "ECRName=$(REPO_NAME)" \
	   --parameters "AlbCertArn=$(AWS_AUSCERT)" \
	   --parameters "AlbNameHost=*" \
	   --parameters "AlbNameDomain=$(AWS_DOMAIN)" \
	   --parameters "AlbNameZoneId=$(AWS_DOMAINZONE)"

undeploy:
	cd iac && UMCCR_DEVELOPER=$(DEVELOPER_NAME) npx cdk destroy


clean:
	cd iac && rm -rf node_modules
	cd backend && rm -rf node_modules

# find any existing lambdas containing both our developer name AND project name
# force a lambda update to the new code in our docker repo
lambda-refresh: backend-image-deploy
	$(eval LAMBDA_ARN=$(shell aws lambda list-functions --output text \
	         --query "Functions[?contains(FunctionName,\`$(DEVELOPER_NAME)\`) == \`true\` && contains(FunctionName,\`$(PROJECT_NAME)\`) == \`true\`].FunctionArn"))
	{ [ -z "$(LAMBDA_ARN)" ] && echo "Make could not find a deployed lambda with both your developer and project name" && false } || true
	aws lambda update-function-code --output text --function-name $(LAMBDA_ARN) --image-uri $(DOCKER_IMAGE) --query "FunctionArn"
	aws lambda wait function-updated --function-name $(LAMBDA_ARN)


.PHONY: all setup backend deploy undeploy lambda-refresh


# not yet used
#$(BACKEND_MODULES): backend/package-lock.json
#	cd backend && npm install
#$(BACKEND_BUNDLE_JS): $(TS_SRC)
#	cd backend && npx esbuild src/bootstrap-lambda.ts --bundle --outfile=build/bootstrap-lambda.js --platform=node "--external:./node_modules/*"
