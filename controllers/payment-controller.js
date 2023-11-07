const ApiError = require("../exceptions/api-error");
const PaymentModel = require("../models/paymentCallback-model");
const OrderQueueModel = require("../models/orders-queue");
const PaymentService = require("../service/payment-service");
const axios = require("axios");
const userModel = require("../models/user-model");
const ordersQueue = require("../models/orders-queue");
const paymentService = require("../service/payment-service");

class PaymentControler {
  async paymentStatus(req, res, next) {
    try {
      // request.post(
      //   {
      //     url: "https://www.portmone.com.ua/gateway",
      //     form: {
      //       method: "result",
      //       params: {
      //         data: {
      //           login: "wdishop",
      //           password: "wdi451",
      //           payeeId: "1185",
      //           status: "",
      //           startDate: "30.03.2023",
      //           endDate: "31.03.2023",
      //           shopOrderNumber: "2001223762",
      //         },
      //       },
      //       id: "1",
      //     },
      //   },
      //   (err, response, body) => {
      //     if (err) return res.status(500).send({ message: err });
      //     return res.send(body);
      //   }
      // );
      // const { orderId } = req.body;
      // if (orderId) {
      // } else {
      //   let allOrders = await OrderQueueModel.find();
      //   console.log(allOrders[0]._id);
      //   let user = await userModel.findOne({ _id: allOrders[0].userId });
      //   return res.json(user);
      // }
      // let responce = await axios.post("https://www.portmone.com.ua/gateway/", {
      //   method: "result",
      //   params: {
      //     data: {
      //       login: "wdishop",
      //       password: "wdi451",
      //       payeeId: "1185",
      //       status: "",
      //       startDate: "30.03.2023",
      //       endDate: "31.03.2023",
      //       shopOrderNumber: "2001223762",
      //     },
      //   },
      //   id: "1",
      // });
      // paymentStatus
    } catch (e) {
      next(e);
    }
  }

  async createForm(req, res, next) {
    try {
      const {
        action,
        amount,
        currency,
        description,
        order_id,
        version,
        server_url,
      } = req.body;
      let form = await PaymentService.createForm(
        action,
        amount,
        currency,
        description,
        order_id,
        version,
        server_url
      );
      return res.json(form);
    } catch (e) {
      next(e);
    }
  }

  async saveCallback(req, res, next) {
    try {
      const ReqData = await req.body;
      const payment = await PaymentModel.create({
        paymentData: ReqData,
      });

      console.log(ReqData);
      // проверяем если оплачено то отправляем сообщение в тг бот
      if (ReqData.status == "PAYED") {
        let userOrder = await ordersQueue.findOne({
          orderId: ReqData.shopOrderNumber,
        });
        if (userOrder) {
          if (userOrder.orderType == "purchase") {
            if (
              JSON.parse(userOrder.orderInformation.deliveryInfo.isPresent) ==
              true
            ) {
              await ordersQueue.deleteOne({
                orderId: ReqData.shopOrderNumber,
              });
              return res.json("present code payed!");
            }

            let deliveryInfo = userOrder.orderInformation.deliveryInfo;
            let goodsInfo = userOrder.orderInformation.goods;

            const TOKEN = "6216984562:AAE__p0j6GBihJBE4XwlhJDYixxlOCkNpUA";
            // const CHAT_ID = "-1001939451453";
            const CHAT_ID = "-1002109394095"; // мій тестовий канал

            const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

            let message = `<b> Заявка з сайту!</b>\n`;
            message += `<b> Номер замовлення:</b> ${deliveryInfo.orderId}\n`;
            message += `<b> Тип оплати:</b> ${deliveryInfo.paymenttype}\n`;
            message += `<b> Сума замовлення:</b> ${deliveryInfo.sumForPay} ${deliveryInfo.currencyPay}\n`;
            message += `<b> Ім'я:</b> ${deliveryInfo.client_name}\n`;
            message += `<b> Пошта:</b> ${deliveryInfo.client_email}\n`;
            message += `<b> Телефон:</b> ${deliveryInfo.client_phone}\n`;

            message += `<b> Доставка куди:</b> ${
              deliveryInfo.client__delivery == "international"
                ? "Інша країні"
                : "Україна"
            }\n`;

            if (deliveryInfo.client__delivery == "international") {
              message += `<b> Країна:</b> ${deliveryInfo.client__country}\n`;
              message += `<b> Область:</b> ${deliveryInfo.client__district}\n`;
              message += `<b> Район:</b> ${deliveryInfo.client__area}\n`;
              message += `<b> Місто:</b> ${deliveryInfo.client_city}\n`;
              message += `<b> Вулиця:</b> ${deliveryInfo.client__street}\n`;
              message += `<b> Будинок:</b> ${deliveryInfo.client__house}\n`;
              message += `<b> Квартира:</b> ${deliveryInfo.client__apartment}\n`;
              message += `<b> Поштовий індекс:</b> ${deliveryInfo.client_postal}\n`;
              message += `<b> Вид Сервісу:</b> ${deliveryInfo.client__service__type}\n`;
              message += `<b> Кому:</b> ${
                deliveryInfo.isPresent ? "Собі" : "На подарунок"
              }\n`;
            } else {
              message += `<b> Спосіб доставки:</b> ${
                deliveryInfo.client__delivry__type == "post"
                  ? "На пошту"
                  : "На адресу"
              }\n`;
              if (deliveryInfo.client__delivry__type == "post") {
                message += `<b> Місто:</b> ${deliveryInfo.client_city}\n`;
                message += `<b> Поштовий індекс:</b> ${deliveryInfo.client_postal}\n`;
                message += `<b> Кому:</b> ${
                  deliveryInfo.isPresent ? "Собі" : "На подарунок"
                }\n`;
              } else {
                message += `<b> Область:</b> ${deliveryInfo.client__district}\n`;
                message += `<b> Район:</b> ${deliveryInfo.client__area}\n`;
                message += `<b> Місто:</b> ${deliveryInfo.client_city}\n`;
                message += `<b> Вулиця:</b> ${deliveryInfo.client__street}\n`;
                message += `<b> Будинок:</b> ${deliveryInfo.client__house}\n`;
                message += `<b> Квартира:</b> ${deliveryInfo.client__apartment}\n`;
                message += `<b> Поштовий індекс:</b> ${deliveryInfo.client_postal}\n`;
                message += `<b> Кому:</b> ${
                  deliveryInfo.isPresent ? "Собі" : "На подарунок"
                }\n`;
              }
            }

            message += `\n`;
            message += `\n`;
            message += `<b> Замовлення </b>\n`;

            goodsInfo.forEach((item) => {
              console.log(item);
              let itemMessage = `<b> Позиція: </b> ${item.goods.name}\n`;
              itemMessage += `<b> Ціна шт: </b> ${item.goods.priceUAH}\n`;
              itemMessage += `<b> Кількість: </b> ${item.amount}\n`;
              itemMessage += `<b> Ціна за всі: </b> ${
                item.goods.priceUAH * item.amount
              }\n`;
              itemMessage += `\n`;
              message += itemMessage;
            });

            let response = await axios.post(URI_API, {
              chat_id: CHAT_ID,
              parse_mode: "html",
              text: message,
            });
            if (response?.status == 200) {
              await ordersQueue.deleteOne({
                orderId: ReqData.shopOrderNumber,
              });
            }
          } else if (userOrder.orderType == "topup") {
            let user = await userModel.findOne({ _id: userOrder.userId });
            let userBalance = user.moneyTokens;
            let replenishmentSum = userOrder.orderInformation.topupSum;
            let newBalance = userBalance + replenishmentSum;

            await userModel.updateOne(
              { _id: userOrder.userId },
              { moneyTokens: newBalance }
            );

            const TOKEN = "6216984562:AAE__p0j6GBihJBE4XwlhJDYixxlOCkNpUA";
            const CHAT_ID = "-1002109394095"; // мій тестовий канал
            //  const CHAT_ID = "-1001939451453";
            const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

            let message = `<b> Поповнення рахунку!</b>\n`;
            message += `<b> Номер замовлення:</b> ${userOrder.orderId}\n`;
            message += `<b> Сума поповненя:</b> ${userOrder.orderInformation.topupSum}\n`;
            message += `<b> Пошта:</b> ${user.email}\n`;

            let response = await axios.post(URI_API, {
              chat_id: CHAT_ID,
              parse_mode: "html",
              text: message,
            });
            if (response?.status == 200) {
              await ordersQueue.deleteOne({
                orderId: ReqData.shopOrderNumber,
              });
            }
          }
        }
      }
      return res.json(payment);
    } catch (e) {
      next(e);
    }
  }

  async addOrderQueue(req, res, next) {
    try {
      let token = req.headers.authorization;
      const { orderId, orderType, orderInformation, clientId } = await req.body;
      let payment = await paymentService.addOrderQueue(
        token,
        orderId,
        orderType,
        orderInformation,
        clientId
      );

      return res.json(payment);
    } catch (e) {
      next(e);
    }
  }

  async openSuccesPage(req, res, next) {
    try {
      return res.redirect(`${process.env.CLIENT_URL}/#success-order`);
    } catch (e) {
      next(e);
    }
  }
  async openErrorPage(req, res, next) {
    try {
      return res.redirect(`${process.env.CLIENT_URL}/#payment-error`);
    } catch (e) {
      next(e);
    }
  }
  async openSuccesTopupPage(req, res, next) {
    try {
      return res.redirect(`${process.env.CLIENT_URL}/#success-topup`);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new PaymentControler();
