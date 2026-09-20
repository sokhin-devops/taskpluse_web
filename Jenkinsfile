pipeline {
    agent any

    stages {

        stage('Check Environment') {
            steps {
                sh '''
                    echo "=== Environment ==="
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
                sh '''
                    echo "=== Installing dependencies ==="
                    npm ci
                '''
            }
        }

        stage('Build Angular') {
            steps {
                sh '''
                    echo "=== Building Angular ==="
                    npm run build
                '''
            }
        }

        stage('Verify Build') {
            steps {
                sh '''
                    echo "=== Angular build output ==="
                    ls -lah dist/taskpulse_web/browser

                    echo ""
                    echo "=== Checking index.html ==="
                    test -f dist/taskpulse_web/browser/index.html

                    echo ""
                    echo "Build verification successful."
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

                echo "======================================"
                echo "TaskPluse Web CI SUCCESS"
                echo "Release Version : ${releaseVersion}"
                echo "CI Build Number : ${env.BUILD_NUMBER}"
                echo "======================================"

                build(
                    job: 'taskpluse-web-deploy',
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
                )
            }
        }

        failure {
            echo "TaskPluse Web CI FAILED."
            echo "Deploy will NOT run."
        }
    }
}