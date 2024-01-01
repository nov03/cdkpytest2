import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import {
  aws_codecommit as codecommit,
  pipelines as pipelines,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { ShellStep } from 'aws-cdk-lib/pipelines';

export class CdkpytestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, `pytestrepo`, {
      repositoryName: "pytestrepo",
    });

    const Pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "LoopPipeline",
      crossAccountKeys: true,
      dockerEnabledForSynth: true,
      synth: new pipelines.CodeBuildStep("Synth", {
        input: pipelines.CodePipelineSource.codeCommit(repo, "main"),
        installCommands: ["npm ci"],
        commands: ["npm run build", "npx cdk synth"],
      }),
    });


    const Stage = Pipeline.addStage(
      new AppStage(this, `DeployStage`, {
        env: {
          account: "968841012693",
          region: "ap-northeast-1",
        },
      })

    );
    Stage.addPre(new ShellStep("Run Unit Tests", {
      commands: [
        'pip install -r requirements.txt', // 依存関係のインストール
        'pytest test/ --cov=lib/lambda --cov-report=xml' // テストとカバレッジレポートの生成
      ]
    }))
  }
}

export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new DeployStack(this, "id", props);
  }
}


export class DeployStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
  }
}