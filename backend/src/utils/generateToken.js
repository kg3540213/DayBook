const jwt = require("jsonwebtoken");

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
};


const generateToken = (_id, res) => {
  const accessToken = jwt.sign(
    { _id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", accessToken, {
    ...cookieBase,
    maxAge: 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
};

module.exports = generateToken;