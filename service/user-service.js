const UserModel = require("../models/user-model");
const ExistingUserIdModel = require("../models/existing-userId");

const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail-service");
const tokenService = require("./token-service");

const UserDto = require("../dtos/user-dto");
const ApiError = require("../exceptions/api-error");
const orderCandidates = require("../models/order-candidates");
const userModel = require("../models/user-model");

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw ApiError.BadRequest(`Користувач з email:  ${email} вже існує`);
    }
    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4(); // v34fa-asfasf-142saf-sa-asf

    const user = await UserModel.create({
      email,
      password: hashPassword,
      activationLink,
      moneyTokens: 0,
      userCart: [],
    });
    // await mailService.sendActivationMail(
    //   email,
    //   `${process.env.API_URL}/api/activate/${activationLink}`
    // );

    const userDto = new UserDto(user); // id, email, isActivated
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink });
    if (!user) {
      throw ApiError.BadRequest("Некоректне посилання активації");
    }
    user.isActivated = true;
    await user.save();
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest("Користувача з таки email не знайдено");
    }
    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest("Невірний пароль");
    }
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async changePassRequest(email) {
    let user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest(
        `Пошту ${email} не знайдено в базі. Перевірте коректність і спробуйте ще раз`
      );
    }
    const resetLink = uuid.v4(); // v34fa-asfasf-142saf-sa-asf
    const resetLinkExp = Date.now() + 60 * 60 + 1000;
    user.resetToken = resetLink;
    user.resetTokenExp = resetLinkExp;
    await user.save();

    await mailService.sendResetPasswordLetter(
      email,
      `${process.env.API_URL}/api/user/changePassword/${resetLink}`
    );

    return { message: "OK", status: 200 };
  }

  async changePassword(resetToken, newPassword) {
    let userCandidate = await userModel.findOne({
      resetToken: resetToken,
    });

    if (!userCandidate || userCandidate.resetTokenExp > Date.now()) {
      return res.redirect(`${process.env.CLIENT_URL}`);
    }

    let hashPassword = await bcrypt.hash(newPassword, 3);

    userCandidate.password = hashPassword;

    userCandidate.resetToken = null;
    userCandidate.resetTokenExp = null;

    await userCandidate.save();

    return { message: "password changed", status: 200 };
  }
  // async refresh(refreshToken) {
  //   if (!refreshToken) {
  //     throw ApiError.UnauthorizedError();
  //   }
  //   const userData = tokenService.validateRefreshToken(refreshToken);
  //   const tokenFromDb = await tokenService.findToken(refreshToken);
  //   if (!userData || !tokenFromDb) {
  //     throw ApiError.UnauthorizedError();
  //   }
  //   const user = await UserModel.findById(userData.id);
  //   const userDto = new UserDto(user);
  //   const tokens = tokenService.generateTokens({ ...userDto });

  //   await tokenService.saveToken(userDto.id, tokens.refreshToken);
  //   return { ...tokens, user: userDto };
  // }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    console.log(userData);
    const tokenFromDb = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    const user = await UserModel.findById(userData.id);
    if (user.password != userData.password) {
      throw ApiError.UnauthorizedError();
    }
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async getAllUsers() {
    const users = await UserModel.find();
    return users;
  }

  async getUsersMoney(req, res) {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    const userMoney = user.moneyTokens;
    return userMoney;
  }

  async getUser(req, res) {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    return user.email;
  }

  async getLastOrder(token, LocalUserID) {
    const accessToken = token.split(" ")[1];
    if (accessToken != "null") {
      const userData = tokenService.validateAccessToken(accessToken);
      const user = await UserModel.findById(userData.id);
      let userID = user.id;

      let userOrder = await orderCandidates.findOne({ userId: userID });
      if (userOrder) {
        let orderObject = userOrder.userOrder;
        await orderCandidates.findOneAndDelete({ userId: userID });
        return orderObject;
      } else {
        return null;
      }
    } else {
      if (!LocalUserID) {
        throw ApiError.BadRequest(
          400,
          "Останнє заиовлення не знайдено, для уточнення інформації зверніться в підтримку!"
        );
      }

      let userOrder = await orderCandidates.findOne({ userId: LocalUserID });
      if (userOrder) {
        let orderObject = userOrder.userOrder;
        await orderCandidates.findOneAndDelete({ userId: LocalUserID });
        return orderObject;
      } else {
        return null;
      }
    }
  }

  async topupUsersMoney(req, res) {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userMoney = user.moneyTokens;

    const { addedMoney } = req.body;

    userMoney = userMoney + addedMoney;

    user.moneyTokens = userMoney;
    await user.save();
    return userMoney;
  }

  async buyWithBonuses(req, res) {
    const authorizationHeader = req.headers.authorization;
    const accessToken = authorizationHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userMoney = user.moneyTokens;

    const { price, order } = req.body;
    userMoney = userMoney - price;

    if (userMoney >= 0) {
      user.moneyTokens = userMoney;
      user.userCart.splice(0, user.userCart.length);
      await user.save();
    } else {
      throw new ApiError(400, "Недостатньо коштів");
    }

    return userMoney;
  }

  async createUserLocalId(req, res) {
    let userID = 0;
    function generateID() {
      const chars = "0123456789abcdef";
      let id = "";

      for (let i = 0; i < 24; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return id;
    }

    // Пример использования функции для генерации ID
    userID = generateID();
    console.log(userID);
    // перевірка чи є такий айді в базі
    let existingId = await ExistingUserIdModel.findOne({ userID: userID });
    if (existingId) {
      await this.createUserLocalId();
      return;
    }
    console.log("not fount and returned");

    await ExistingUserIdModel.create({ userID: userID });
    return userID;
  }
}

module.exports = new UserService();
