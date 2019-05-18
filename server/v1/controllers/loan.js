/* eslint-disable radix */
import moment from 'moment';
import models from '../model/db';
import validate from '../../helper/validation';

class Loan {
  /** *
     * @param{req} object
     * @param{res} object
     */
  static loan(req, res) {
    try {
      const aUser = models.User.find(user => user.id === req.user.id);
      if (aUser.status === 'pending' || aUser.status === 'unverified') {
        return res.status(400).json({
          status: 400,
          error: 'wait for verification and re-apply for loan',
        });
      }
      const { error } = validate.validateLoan(req.body);
      if (error) {
        return res.status(422).json({
          status: 422,
          error: error.details[0].message,
        });
      }

      const amount = parseFloat(req.body.amount);
      const tenor = parseFloat(req.body.tenor);
      const interest = (0.05 * amount);
      const paymentInstallment = ((amount + interest) / tenor);

      const applyLoan = {
        id: models.Loans.length + 1,
        user: req.user.email,
        createdOn: moment(new Date()),
        status: 'pending',
        repaid: false,
        tenor,
        amount,
        paymentInstallment,
        balance: (amount + interest),
        interest,
        modifiedOn: moment(new Date()),
      };
      const existLoan = models.Loans.filter(email => email.user === req.user.email);
      for (let i = 0; i < existLoan.length; i += 1) {
        if (existLoan[i].repaid === false) {
          return res.status(402).json({
            status: 402,
            error: 'you have an outstanding loan',
          });
        }
      }
      models.Loans.push(applyLoan);
      return res.status(201).json({
        status: 201,
        data: applyLoan,
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        error: 'something went wrong',
      });
    }
  }

  /** *
     * loan repayment history
     * @param{req}object
     * @param{res}object
     */
  static repaymentHistory(req, res) {
    const requestId = parseInt(req.params.id);
    const loans = models.Loans;
    try {
      const loan = loans.find(oneLoan => oneLoan.id === requestId);
      if (!loan) {
        return res.status('404').json({
          status: 404,
          error: 'loan not found',
        });
      }
      // user can only get their posted loan
      if (req.user.email === loan.user) {
        return res.status(200).json({
          status: 200,
          data: loan,
        });
      }
      return res.status(400).json({
        status: 400,
        error: 'hmmm...you do not have access',
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        error: 'something went wrong',
      });
    }
  }
}

export default Loan;
