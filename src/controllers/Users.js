const hs = require("http-status");
const { list, insert, findOne } = require("../services/Users");
const { passwordToHash, generateJWTAccessToken, generateJWTRefreshToken } = require("../scripts/utils/helper");
const eventEmitter = require("../scripts/events/eventEmitter");

const index = (req, res) => {
  list()
    .then((userList) => {
      if (!userList) res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Sorun var.." });
      res.status(hs.OK).send(userList);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

const create = (req, res) => {
  req.body.password = passwordToHash(req.body.password);
  insert(req.body)
    .then((createdUser) => {
      if (!createdUser) res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Sorun var.." });
      res.status(hs.OK).send(createdUser);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

const login = (req, res) => {
  req.body.password = passwordToHash(req.body.password);
  findOne(req.body)
    .then((user) => {
      if (!user) return res.status(hs.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunmamaktadır." });
      user = {
        ...user.toObject(),
        tokens: {
          access_token: generateJWTAccessToken(user),
          refresh_token: generateJWTRefreshToken(user),
        },
      };
      delete user.password;
      res.status(hs.OK).send(user);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

//! ÖDEV Video Üzerinden izleyip implemente edilecek.
// https://www.youtube.com/watch?v=pMi3PiITsMc
const resetPassword = (req, res) => {
  const newPassword = uuid.v4()?.split("-")[0] || `usr-${new Date().getTime()}`;
  modify({ email: req.body.email }, { password: passwordToHash(newPassword) })
    .then((updatedUser) => {
      if (!updatedUser)
        return res.status(hs.NOT_FOUND).send({
          error: "User has not been found.",
        });
      eventEmitter.emit("send_email", {
        to: updatedUser.email,
        subject: "Reset Password",
        html: `Password has been successfully reset.`,
      });
      res.status(hs.OK).send({ message: "Please check your email." });
    })
    .catch(() => {
      res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Some unknown error has been occurred during password reset." });
    });
};

module.exports = {
  index,
  create,
  login,
  resetPassword,
};
