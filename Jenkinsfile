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
        sh '''
            echo "Current directory:"
            pwd

            echo "Workspace:"
            ls -lah

            echo "All directories:"
            find . -maxdepth 3 -type d | sort

            echo "Looking for Angular index.html:"
            find . -name index.html -type f | sort
        '''
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