const ApiError = require("../exceptions/api-error");
const CertificateService = require("../service/certificate-service");

class CertificateControler {
  async registerCertificate(req, res, next) {
    try {
      const token = req.headers.authorization;
      let { orderId, orderContent, LocalUserID } = req.body;
      let response = await CertificateService.registerCertificate(
        token,
        orderId,
        orderContent,
        LocalUserID
      );
      return res.json(response);
    } catch (e) {
      next(e);
    }
  }

  async useCertificate(req, res, next) {
    try {
      let response = await CertificateService.useCertificate(req, res);
      return res.json(response);
    } catch (e) {
      next(e);
    }
  }

  async getCertificateData(req, res, next) {
    try {
      let { certificateId } = req.body;
      let response = await CertificateService.getCertificateData(certificateId);
      return res.json(response);
    } catch (e) {
      next(e);
    }
  }

  async getCheckAndSubmit(req, res, next) {
    try {
      let { certificatesArr, LocalUserID } = req.body;
      let token = req.headers.authorization;

      let response = await CertificateService.getCheckAndSubmit(
        token,
        certificatesArr,
        LocalUserID
      );
      return res.json(response);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new CertificateControler();
