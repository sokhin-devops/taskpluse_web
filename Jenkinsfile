pipeline {
    agent any

    stages {

        stage('Check Environment') {
            steps {
                sh '''
                    node --version
                    npm --version
                    java --version
                '''
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Angular') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Verify Build') {
            steps {
                sh '''
                    echo "Angular build output:"
                    ls -lah dist/taskpulse_web/browser

                    echo "Checking index.html..."
                    test -f dist/taskpulse_web/browser/index.html
                '''
            }
        }

        stage('Archive Artifact') {
            steps {
                archiveArtifacts(
                    artifacts: 'dist/taskpulse_web/browser/**',
                    fingerprint: true
                )
            }
        }
    }

    post {

        success {
            script {
                def releaseVersion = env.BUILD_NUMBER

                echo "TaskPluse Web CI completed successfully."
                echo "Release version: ${releaseVersion}"

                build job: 'taskpluse-web-deploy',
                    parameters: [
                        string(
                            name: 'RELEASE_VERSION',
                            value: releaseVersion
                        ),
                        string(
                            name: 'CI_BUILD_NUMBER',
                            value: env.BUILD_NUMBER
                        )
                    ],
                    wait: false
            }
        }

        failure {
            echo 'TaskPluse Web CI failed. Deploy will not run.'
        }
    }
}