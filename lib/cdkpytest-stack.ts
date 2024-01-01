import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ReportGroup } from 'aws-cdk-lib/aws-codebuild';
import { Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import {
  aws_codecommit as codecommit,
  pipelines as pipelines,
  aws_codebuild as codebuild,
} from "aws-cdk-lib";
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';

export class CdkpytestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // レポートグループの作成
    const reportGroup = new ReportGroup(this, 'ReportGroup', {
      reportGroupName: 'MyTestReports',
    });
    // 既存のコードリポジトリとパイプラインの定義
    const repo = new codecommit.Repository(this, `pytestrepo`, {
      repositoryName: "pytestrepo",
    });

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "PytestPipeline",
      crossAccountKeys: true,
      dockerEnabledForSynth: true,
      synth: new pipelines.CodeBuildStep("Synth", {
        input: pipelines.CodePipelineSource.codeCommit(repo, "main"),
        installCommands: ["npm ci"],
        commands: ["npm run build", "npx cdk synth"],
      }),
    });

    const pytestStep = new CodeBuildStep('PytestStep', {
      // 既存のコマンドや設定
      commands: [
        'pip install -r requirements.txt',
        'pytest test/ --cov=lib/lambda --junitxml=coverage.xml',
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
            'report-group-arn': 'arn:aws:codebuild:ap-northeast-1:968841012693:report-group/PipelineDeployStage2PytestS-S8OcVqJCkGFu-pytest-reports'
          }
        }
      }),
      // その他のオプション
    });

    const Stage = pipeline.addStage(
      new AppStage(this, `DeployStage2`, {
        env: {
          account: "968841012693",
          region: "ap-northeast-1",
        },
      })
    );
    Stage.addPre(pytestStep)


  }
}

class CustomStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    // ここでAWSリソースを追加する
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