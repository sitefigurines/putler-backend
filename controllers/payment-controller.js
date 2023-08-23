const ApiError = require("../exceptions/api-error");
const PaymentModel = require("../models/paymentCallback-model");
const OrderQueueModel = require("../models/orders-queue");
const PaymentService = require("../service/payment-service");
const axios = require("axios");
const userModel = require("../models/user-model");
const ordersQueue = require("../models/orders-queue");

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
      // проверяем если оплачено то отправляем сообщение в тг бот
      if (ReqData.status == "PAYED") {
        let userOrder = await ordersQueue.findOne({
          orderId: ReqData.shopOrderNumber,
        });
        if (userOrder) {
          if (userOrder.orderType == "purchase") {
            if (
              JSON.parse(userOrder.orderInformation.delivery.isPresent) == true
            ) {
              await ordersQueue.deleteOne({
                orderId: ReqData.shopOrderNumber,
              });
              return res.json("present code payed!");
            }
            const TOKEN = "6216984562:AAE__p0j6GBihJBE4XwlhJDYixxlOCkNpUA";
            const CHAT_ID = "-1001939451453";
            const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

            let message = `<b> Заявка з сайту!</b>\n`;
            message += `<b> Номер замовлення:</b> ${userOrder.orderId}\n`;
            message += `<b> Ім'я:</b> ${userOrder.orderInformation.delivery.client_name}\n`;
            message += `<b> Пошта:</b> ${userOrder.orderInformation.delivery.client_email}\n`;
            message += `<b> Телефон:</b> ${userOrder.orderInformation.delivery.client_phone}\n`;
            message += `<b> Місто:</b> ${userOrder.orderInformation.delivery.client_city}\n`;
            message += `<b> Поштовий індекс:</b> ${userOrder.orderInformation.delivery.client_postal}\n`;
            message += `<b> Кому:</b> ${userOrder.orderInformation.delivery.buy_type}\n`;
            message += `<b> Тип оплати:</b> ${userOrder.orderInformation.delivery.paymenttype}\n`;
            message += `\n`;
            message += `\n`;
            message += `<b> Замовлення </b>\n`;

            userOrder.orderInformation.goods.forEach((item) => {
              let itemMessage = `<b> Назва замовлення: </b> ${item.name}\n`;
              itemMessage += `<b> Ціна шт: </b> ${item.priceForOne}\n`;
              itemMessage += `<b> Кількість: </b> ${item.amount}\n`;
              itemMessage += `<b> Ціна за всі: </b> ${item.priceForMany}\n`;
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

            const TOKEN = "6216984562:AAE__p0j6GBihJBE4XwlhJDYixxlOCkNpUA";
            const CHAT_ID = "-1001939451453";
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
      const userId = req.user.id;
      const { orderId, orderType, orderInformation } = await req.body;
      const payment = await OrderQueueModel.create({
        userId: userId,
        orderId: orderId,
        orderType: orderType,
        orderInformation: orderInformation,
        createdAt: new Date().getTime(),
      });

      let order = {
        userId: userId,
        orderId: orderId,
        orderType: orderType,
        orderInformation: orderInformation,
        createdAt: new Date().getTime(),
      };

      let user = await userModel.updateOne(
        { _id: userId },
        { userOrders: [order] }
      );

      if (!user) {
        throw ApiError.BadRequest("помилка покупки товару");
      }

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
