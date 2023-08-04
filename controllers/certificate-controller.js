const ApiError = require("../exceptions/api-error");
const CertificateService = require("../service/certificate-service");

class CertificateControler {
  async registerCertificate(req, res, next) {
    try {
      let response = await CertificateService.registerCertificate(req, res);
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
}

module.exports = new CertificateControler();
