const jwt = require("jsonwebtoken");
const GoodsModel = require("../models/goods-model");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const ApiError = require("../exceptions/api-error");
const certificateModel = require("../models/certificate-model");

class CerteficateService {
  async registerCertificate(token, orderId, orderContent, LocalUserID) {
    const accessToken = token.split(" ")[1];
    if (accessToken != "null") {
      const userData = tokenService.validateAccessToken(accessToken);
      const user = await UserModel.findById(userData.id);
      if (!user) {
        throw ApiError.BadRequest("User not fount, try again letter");
      }
      const userEmail = user.email;
      const userId = user.id;

      let existingCertificate = await certificateModel.findOne({
        orderId: orderId,
      });
      if (existingCertificate) {
        throw ApiError.BadRequest(
          `Code is existing, just copy the number and use it! Your code is ${existingCertificate.orderId} ;)`
        );
      }

      let certificate = await certificateModel.create({
        orderId: orderId,
        content: orderContent,
        userOwner: userEmail,
        userId: userId,
      });
      let responceOrderContent = [];
      for (const cartItem of orderContent) {
        const articulus = cartItem.articulus;
        const goods = await GoodsModel.findOne({ articulus: articulus });
        if (goods) {
          const resData = {
            goods: goods,
            amount: cartItem.amount,
          };
          responceOrderContent.push(resData);
        }
      }
      return { userEmail, responceOrderContent, userId: userId };
    } else {
      if (!LocalUserID) {
        throw ApiError.BadRequest(
          "An error while creating a gift-code for your client, please connect with support to get more information"
        );
      }
      const userId = LocalUserID;

      let existingCertificate = await certificateModel.findOne({
        orderId: orderId,
      });
      if (existingCertificate) {
        throw ApiError.BadRequest(
          `Code is existing, just copy the number and use it! Your code is ${existingCertificate.orderId} ;)`
        );
      }

      let certificate = await certificateModel.create({
        orderId: orderId,
        content: orderContent,
        userOwner: null,
        userId: userId,
      });
      let responceOrderContent = [];
      for (const cartItem of orderContent) {
        const articulus = cartItem.articulus;
        const goods = await GoodsModel.findOne({ articulus: articulus });
        if (goods) {
          const resData = {
            goods: goods,
            amount: cartItem.amount,
          };
          responceOrderContent.push(resData);
        }
      }
      return { userEmail: null, responceOrderContent, userId: userId };
    }
  }

  async useCertificate(req, res) {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    const userCart = user.userCart;
    const { certificateId } = req.body;
    const validateCertificate = await certificateModel.findOne({
      orderId: certificateId,
    });
    if (!validateCertificate) {
      throw new ApiError(404, "Сертифікат не знайдено");
    }
    const userEmail = user.email;
    let certificateOrder = validateCertificate.content;
    for (const item of certificateOrder) {
      userCart.push(item);
    }

    await certificateModel.findOneAndDelete({
      orderId: certificateId,
    });

    user.save();
    return { validateCertificate, userEmail };
  }

  async getCertificateData(certificate) {
    const validateCertificate = await certificateModel.findOne({
      orderId: certificate,
    });
    if (!validateCertificate) {
      throw ApiError.BadRequest("Sertificate is already used or not found");
    }
    return { validateCertificate };
  }

  async getCheckAndSubmit(token, certificates, LocalUserID) {
    const accessToken = token.split(" ")[1];
    if (accessToken != "null") {
      const userData = tokenService.validateAccessToken(accessToken);
      const user = await UserModel.findById(userData.id);
      if (!user) {
        throw ApiError(400, "Invalid fields");
      }

      for (const certificate of certificates) {
        let existedSertificate = await certificateModel.findOne({
          orderId: certificate,
        });
        console.log(existedSertificate);
        if (!existedSertificate) {
          throw ApiError.BadRequest(
            "Gift-code isn't found. It could be already used by another people"
          );
        }
        await certificateModel.findOneAndDelete({
          orderId: certificate,
        });

        user.usedCertificates.push(certificate);
        await user.save();
      }

      return { submited: true, message: "the gift-code is submited" };
    } else {
      for (const certificate of certificates) {
        let existedSertificate = await certificateModel.findOne({
          orderId: certificate,
        });
        console.log(existedSertificate);
        if (!existedSertificate) {
          throw ApiError.BadRequest(
            "Gift-code isn't found. It could be already used by another people"
          );
        }
        await certificateModel.findOneAndDelete({
          orderId: certificate,
        });
      }

      return { submited: true, message: "the gift-code is submited" };
    }

    // const validateCertificate = await certificateModel.findOne({
    //   orderId: certificate,
    // });
    // return { validateCertificate };
  }
}

module.exports = new CerteficateService();
