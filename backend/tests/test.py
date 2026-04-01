import requests

response = requests.get(
    "https://media.cnn.com/api/v1/images/stellar/prod/gettyimages-2268863751-2.jpg?c=original&q=w_1041,c_fill"
)

with open("file.zip", "wb") as f:
    f.write(response.content)
