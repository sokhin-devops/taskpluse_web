// TaskPluse Web - CI pipeline.
// The Jenkins job 'taskpluse-web' is defined in taskpluse_deploy/infra/jenkins/casc.yaml
// and checks GitHub for new commits every 5 minutes.
//
//   Checkout -> Gitleaks -> Unit tests -> Dependency scan -> Build image
//            -> Image scan -> Push to Nexus -> Start deploy (taskpluse-deploy job)
//
// Node, npm and Chromium live in the Dockerfile's stages, not on the Jenkins
// machine - Jenkins only needs docker, trivy and gitleaks.
// Shell steps use single quotes so values like the Nexus password are expanded
// by the shell from the environment, never pasted into the script by Groovy -
// that keeps them out of the build log.
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        REGISTRY = 'localhost:5001'
        IMAGE    = 'localhost:5001/taskpluse-web'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    // Build number + commit: unique, sortable, and says which code is inside.
                    env.TAG = "${env.BUILD_NUMBER}-${env.GIT_SHORT}"
                }
                echo "Building ${env.IMAGE}:${env.TAG}"
            }
        }

        stage('Secrets scan (Gitleaks)') {
            steps {
                // The whole git history, not just the latest files: a password
                // committed once and deleted later is still in the history.
                sh 'gitleaks git --no-banner --redact --exit-code 1 .'
            }
        }

        stage('Unit tests') {
            steps {
                // The Dockerfile's test stage: Karma + headless Chromium, same
                // Node and npm packages as the real build.
                sh 'docker build --target test --progress=plain -t taskpluse-web-test:${TAG} .'
            }
        }

        stage('Dependency scan (Trivy)') {
            steps {
                // package-lock.json pins every npm package, so Trivy can check it
                // without the network. devDependencies (Angular CLI, Karma...)
                // are skipped by default: they build the app but don't ship.
                // Report HIGH and CRITICAL; fail only on CRITICAL that has a fix.
                sh '''
                    SCAN="--scanners vuln --timeout 15m --no-progress"
                    trivy fs $SCAN --severity HIGH,CRITICAL package-lock.json
                    trivy fs $SCAN --severity CRITICAL --ignore-unfixed --exit-code 1 --quiet package-lock.json
                '''
            }
        }

        stage('Build image') {
            steps {
                sh '''
                    docker build --progress=plain \
                        --build-arg VERSION=${TAG} \
                        --build-arg GIT_SHA=${GIT_SHORT} \
                        --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                        -t ${IMAGE}:${TAG} .
                '''
            }
        }

        stage('Image scan (Trivy)') {
            steps {
                // The whole image: nginx and Alpine packages, plus a secret scan
                // of the shipped files (a key baked into the JS bundle).
                sh '''
                    trivy image --severity HIGH,CRITICAL --timeout 15m --no-progress ${IMAGE}:${TAG}
                    trivy image --severity CRITICAL --ignore-unfixed --exit-code 1 --timeout 15m --no-progress --quiet ${IMAGE}:${TAG}
                '''
            }
        }

        stage('Push to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-push',
                                                  usernameVariable: 'NEXUS_USER',
                                                  passwordVariable: 'NEXUS_PASSWORD')]) {
                    sh '''
                        echo "$NEXUS_PASSWORD" | docker login ${REGISTRY} -u "$NEXUS_USER" --password-stdin
                        docker push ${IMAGE}:${TAG}
                        docker logout ${REGISTRY}
                    '''
                }
            }
        }

        stage('Start deploy') {
            steps {
                // CD is its own job (taskpluse_deploy/Jenkinsfile): staging, smoke test,
                // approval, prod. Don't wait for it - it pauses for a person.
                build job: 'taskpluse-deploy', wait: false, parameters: [
                    string(name: 'APP', value: 'web'),
                    string(name: 'TAG', value: env.TAG)
                ]
            }
        }
    }

    post {
        success {
            echo "Pushed ${env.IMAGE}:${env.TAG}"
        }
        always {
            // Images live in Nexus now; don't let them pile up on this PC.
            sh 'docker rmi ${IMAGE}:${TAG} taskpluse-web-test:${TAG} >/dev/null 2>&1 || true'
            cleanWs()
        }
    }
}
