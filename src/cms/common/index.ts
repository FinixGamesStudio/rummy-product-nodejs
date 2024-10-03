export function generateRandomUserNameOnlyCharacter(
  userNamelength: number
): String {
  let userName = "";
  const randomString = "ABCDEFGHJKMNPQRSTUVWXYZ";

  for (let i = 1; i <= userNamelength; i++) {
    const char = Math.floor(Math.random() * randomString.length + 1);
    userName += randomString.charAt(char);
  }

  return userName;
}

export function generateRandomUserName(userNamelength: number): String {
  let userName = "";
  const randomString = "ABCDEFGHJKMNPQRSTUVWXYZ" + "123456789";

  for (let i = 1; i <= userNamelength; i++) {
    const char = Math.floor(Math.random() * randomString.length + 1);
    userName += randomString.charAt(char);
  }

  return userName;
}
