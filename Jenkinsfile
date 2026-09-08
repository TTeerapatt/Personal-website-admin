pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    booleanParam(
      name: 'DEPLOY',
      defaultValue: true,
      description: 'Deploy ด้วย docker compose หลัง build สำเร็จ'
    )
    string(
      name: 'NEXT_PUBLIC_BACKEND_URL',
      defaultValue: 'https://trpgls.com/personal-website/api/',
      description: 'Backend URL used by the browser (baked into Next.js at build time)'
    )
    string(
      name: 'PERSONAL_WEBSITE_ADMIN_PORT',
      defaultValue: '3002',
      description: 'Host port mapped to container (host:container → PORT:3002)'
    )
  }

  environment {
    COMPOSE_PROJECT_NAME = 'personal-website-admin'
    IMAGE_NAME = 'personal-website-admin'
    NEXT_PUBLIC_BACKEND_URL = "${params.NEXT_PUBLIC_BACKEND_URL}"
    PERSONAL_WEBSITE_ADMIN_PORT = "${params.PERSONAL_WEBSITE_ADMIN_PORT}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build image') {
      steps {
        sh '''
          set -e
          export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL}"
          export PERSONAL_WEBSITE_ADMIN_PORT="${PERSONAL_WEBSITE_ADMIN_PORT}"
          docker compose build personal-website-admin
        '''
      }
    }

    stage('Deploy') {
      when {
        expression { return params.DEPLOY == true }
      }
      steps {
        sh '''
          set -e
          export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL}"
          export PERSONAL_WEBSITE_ADMIN_PORT="${PERSONAL_WEBSITE_ADMIN_PORT}"
          docker compose up -d --remove-orphans personal-website-admin
        '''
      }
    }

    stage('Health check') {
      when {
        expression { return params.DEPLOY == true }
      }
      steps {
        sh '''
          set -e
          echo "Waiting for admin on :${PERSONAL_WEBSITE_ADMIN_PORT}/personal-website-admin ..."
          for i in $(seq 1 30); do
            code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PERSONAL_WEBSITE_ADMIN_PORT}/personal-website-admin" || true)"
            if echo "$code" | grep -Eq '^[123]'; then
              echo "Admin is healthy (HTTP $code)"
              exit 0
            fi
            if [ "$i" -eq 30 ]; then
              echo "Admin health check failed (HTTP $code)"
              docker compose ps || true
              docker compose logs --tail=80 personal-website-admin || true
              exit 1
            fi
            sleep 2
          done
        '''
      }
    }
  }

  post {
    success {
      echo "personal-website-admin #${env.BUILD_NUMBER} succeeded"
    }
    failure {
      echo "personal-website-admin #${env.BUILD_NUMBER} failed"
      sh 'docker compose ps || true'
    }
  }
}
