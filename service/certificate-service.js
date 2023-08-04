const jwt = require("jsonwebtoken");
const GoodsModel = require("../models/goods-model");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const ApiError = require("../exceptions/api-error");
const certificateModel = require("../models/certificate-model");

class CerteficateService {
  async registerCertificate(req, res) {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    const userEmail = user.email;
    const { orderId, orderContent } = req.body;
    let certificate = await certificateModel.create({
      orderId: orderId,
      content: orderContent,
      userOwner: userEmail,
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
    return { userEmail, responceOrderContent };
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
}

module.exports = new CerteficateService();
