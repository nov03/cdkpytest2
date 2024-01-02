def statement_coverage(flg1, flg2):
    print("Hello")
    if flg1 or flg2:
        print("true")
    else:
        print("false!")

def lambda_handler(event, context):
    # Extract flags from the event object
    flg1 = event.get('flg1', False)
    flg2 = event.get('flg2', False)

    # Call the statement_coverage function with the flags
    statement_coverage(flg1, flg2)

    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }
