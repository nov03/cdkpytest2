import os,sys
# Lambda関数があるディレクトリへの絶対パスをsys.pathに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
target_dir = os.path.join(parent_dir, 'lib/func')
sys.path.append(target_dir)



from pytest_sample import lambda_handler

def test_lambda_handler_true():
    event = {'flg1': True, 'flg2': False}
    result = lambda_handler(event, None)
    assert result['statusCode'] == 200, "Status code should be 200"
    assert result['body'] == 'Hello from Lambda!', "Response body should be 'Hello from Lambda!'"

def test_lambda_handler_false():
    event = {'flg1': False, 'flg2': False}
    result = lambda_handler(event, None)
    assert result['statusCode'] == 200, "Status code should be 200"
    assert result['body'] == 'Hello from Lambda!', "Response body should be 'Hello from Lambda!'"

