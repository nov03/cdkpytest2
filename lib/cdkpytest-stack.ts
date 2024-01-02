import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import {
  aws_codecommit as codecommit,
  pipelines as pipelines,
  aws_codebuild as codebuild,
} from "aws-cdk-lib";
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';

import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';


export class CdkpytestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const connectionArn =
      "arn:aws:codestar-connections:ap-northeast-1:968841012693:connection/c90bc59d-a5d2-4cf0-965f-8f4d962ac667";

    // 既存のコードリポジトリとパイプラインの定義
    const repo = new codecommit.Repository(this, `pytestrepo`, {
      repositoryName: "pytestrepo",
    });

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "PytestPipeline",
      crossAccountKeys: true,
      dockerEnabledForSynth: true,
      synth: new pipelines.CodeBuildStep("Synth", {
        input: pipelines.CodePipelineSource.codeCommit(repo, 'main'),
        // input: pipelines.CodePipelineSource.connection(
        //   'nov03/cdkpytest2', 'main',
        //   {
        //     connectionArn: connectionArn,
        //     triggerOnPush: true,
        //   }
        // ),
        installCommands: ["npm ci"],
        commands: ["npm run build", "npx cdk synth"],
      }),
    });



    const Stage = pipeline.addStage(
      new AppStage(this, `DeployStage2`, {
        env: {
          account: "968841012693",
          region: "ap-northeast-1",
        },
      })
    );

    const pytestStep = new CodeBuildStep('PytestStep', {
      // 既存のコマンドや設定
      commands: [
        'pip install -r requirements.txt',
        'mkdir -p test-reports',
        'pytest test/ --cov=lib/func --junitxml=test-reports/coverage.xml',
        'ls -l'
      ],
      // partialBuildSpecを使用してreportsセクションを定義
      partialBuildSpec: BuildSpec.fromObject({
        // ここでレポートグループの設定を行う
        reports: {
          'pytest-reports': { // この名前は任意です
            files: ['**/*coverage.xml'], // ここにはテスト結果ファイルのパスを指定
            'file-format': 'JUNIT', // フォーマット指定
            'base-directory': 'test-reports', // テストレポートが生成されるディレクトリ
          }
        }
      }),
      // その他のオプション
    });
    Stage.addPre(pytestStep)

















    // CodeBuildプロジェクトのインスタンスを定義
    const project = new codebuild.Project(this, 'MyCodeBuildProject', {
      source: codebuild.Source.codeCommit({ repository: repo }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Building...',
              // 他のビルドコマンド
            ],
          },
        },
        // 他のbuildSpecの設定
      }),
    });
    // Step Functionsのステートマシンで使用するタスクを定義
    const startBuildTask = new stepfunctionsTasks.CodeBuildStartBuild(this, 'StartBuild', {
      project: project,
      // 必要に応じてenvironmentVariablesOverrideを設定
    });

    // ステートマシンの定義
    const definition = new stepfunctions.Pass(this, 'DefState', {
      resultPath: '$.buildResult',
      result: stepfunctions.Result.fromObject({
        BuildStatus: 'Started'
      })
    }).next(startBuildTask);

    const stateMachine = new stepfunctions.StateMachine(this, 'StateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5)
    });


    // EventBridgeルールを定義
    const rule = new events.Rule(this, 'Rule', {
      eventPattern: {
        source: ['aws.codecommit'],
        detailType: ['CodeCommit Repository State Change'],
        resources: [repo.repositoryArn],
        detail: {
          event: ['referenceCreated', 'referenceUpdated'],
          referenceType: ['branch'],
          referenceName: [{
            prefix: 'feature/'
          }]
        }
      }
    });

    // EventBridgeルールをステートマシンに接続
    rule.addTarget(new targets.SfnStateMachine(stateMachine));



  }
}

export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new DeployStack(this, "id2", props);
  }
}


export class DeployStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
  }
}