import os,sys
# Lambda関数があるディレクトリへの絶対パスをsys.pathに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
target_dir = os.path.join(parent_dir, 'cdkpytest/lib/func')
sys.path.append(target_dir)



# Lambda関数のファイルをインポート
try:
    from pytest_sample import lambda_handler
except ModuleNotFoundError:
    print(f"Current sys.path: {sys.path}")
    raise

def test_lambda_handler():
    event = {}  # テスト用のイベント
    context = None  # Lambdaコンテキストは通常、テストでは必要ありません
    response = lambda_handler(event, context)
    assert response['statusCode'] == 200
    assert response['body'] == 'Hello from Lambda!'
