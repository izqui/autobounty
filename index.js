/*
 * Bot that receives a POST request (from a GitHub issue comment webhook)
 * and in case it's a comment that has "@autobounty <decimal> <currency>"
 * awards that bounty to the address posted earlier in the thread (by the
 * commiteth bot).
 * TODO tests
 */

const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs-query');

const address = process.env.ADDRESS

const provider = new SignerProvider(process.env.NODE, {
  signTransaction: (rawTx, cb) => cb(null, sign(rawTx, process.env.KEY)),
  accounts: (cb) => cb(null, [address]),
});
const eth = new Eth(provider);

var express = require('express'),
    cors = require('cors'),
    app = express(),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json();

app.use(jsonParser);
app.use(cors());

// Receive a POST request at the address specified by an env. var.
app.post('/address/:address', function(req, res, next){
  eth.getTransactionCount(address, (err, nonce) => {
    eth.sendTransaction({
      from: address, // Specified in webhook, secret
      to: req.params.address, // TODO replace with address from earlier in the thread
      gas: 100000,
      value: (parseFloat(process.env.AMOUNT) || 1.5) * 1e18, // TODO replace with parsed amount from comments
      data: '0xde5f72fd', // sha3('faucet()')
      nonce,
    }, (err, txID) => {
      if (err) {
        console.log('Request failed', err)
        return res.status(500).json(err)
      }
      else {
        console.log('Successful request:', txID)
        res.json({ txID })
      }
    });
  });
});

const port = process.env.PORT || 8181
app.listen(port, function(){
  console.log('Autobounty listening on port', port);
});
