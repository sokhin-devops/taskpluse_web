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
                dir('taskpluse_web') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Angular') {
            steps {
                dir('taskpluse_web') {
                    sh 'npm run build'
                }
            }
        }

        stage('Verify Build') {
            steps {
                dir('taskpluse_web') {
                    sh '''
                        echo "Angular build output:"
                        ls -lah dist/taskpulse_web/browser

                        echo "Checking index.html..."
                        test -f dist/taskpulse_web/browser/index.html
                    '''
                }
            }
        }

        stage('Archive Artifact') {
            steps {
                archiveArtifacts(
                    artifacts: 'taskpluse_web/dist/taskpulse_web/browser/**',
                    fingerprint: true
                )
            }
        }
    }

    post {
        success {
            echo 'TaskPluse Web CI completed successfully.'
        }

        failure {
            echo 'TaskPluse Web CI failed.'
        }
    }
}