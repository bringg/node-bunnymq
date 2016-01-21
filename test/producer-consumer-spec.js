
var assert = require('assert');
var producer = require('../index')().producer;
var consumer = require('../index')().consumer;
var uuid = require('node-uuid');

var fixtures = {
  queues: ['test-queue-0', 'test-queue-1', 'test-queue-2']
};

var letters = 0;

describe('Producer/Consumer msg delevering:', function() {
  before(function (done) {
    return consumer.connect()
    .then(function (_channel) {
      assert(_channel !== undefined);
      assert(_channel !== null);
    })
    .then(function () {
      return producer.connect();
    })
    .then(function (_channel) {
      assert(_channel !== undefined);
      assert(_channel !== null);
    })
    .then(done);
  });

  it('should be able to consume message sended by producer to queue [test-queue-0]', function (done) {
    consumer.consume(fixtures.queues[0], function (_msg) {
      assert(typeof _msg === 'string');
      --letters;
      if (!letters) return done();

      return true;
    })
    .then(function (_queue) {
      assert(_queue === fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      return producer.produce(fixtures.queues[0], { msg: uuid.v4() });
    })
    .then(function (_queue) {
      ++letters;
      assert(_queue === fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    });
  });

  it('should not be able to consume message sended by producer to queue [test-queue-1]', function (done) {
    consumer.consume(fixtures.queues[0], function (_msg) {
      assert(typeof _msg === 'string');
      --letters;
      if (!letters) return done();

      return true;
    })
    .then(function (_queue) {
      assert(_queue === fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      return producer.produce(fixtures.queues[1], { msg: uuid.v4() });
    })
    .then(function (_queue) {
      ++letters;
      assert(_queue !== fixtures.queues[0]);
      assert(_queue === fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      setTimeout(done, 2000);
    });
  });

  it('should be able to consume message sended by producer to queue [test-queue-1], and the message of the previous test case', function (done) {
    consumer.consume(fixtures.queues[1], function (_msg) {
      assert(typeof _msg === 'string');
      --letters;
      if (!letters) return done();

      return true;
    })
    .then(function (_queue) {
      assert(_queue !== fixtures.queues[0]);
      assert(_queue === fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      return producer.produce(fixtures.queues[1], { msg: uuid.v4() });
    })
    .then(function (_queue) {
      ++letters;
      assert(_queue !== fixtures.queues[0]);
      assert(_queue === fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    });
  });

  it('should be able to consume all message populated by producer to all queues [test-queue-0, test-queue-1, test-queue-2]', function (done) {
    producer.produce(fixtures.queues[2], { msg: uuid.v4() })
    .then(function (_queue) {
      ++letters;
      assert(_queue !== fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue === fixtures.queues[2]);
    })
    .then(function () {
      return producer.produce(fixtures.queues[1], { msg: uuid.v4() });
    })
    .then(function (_queue) {
      ++letters;
      assert(_queue !== fixtures.queues[0]);
      assert(_queue === fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      return producer.produce(fixtures.queues[0], { msg: uuid.v4() });
    })
    .then(function (_queue) {
      ++letters;
      assert(_queue === fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      return consumer.consume(fixtures.queues[2], function (_msg) {
        assert(typeof _msg === 'string');
        --letters;
        if (!letters) {
          setTimeout(function () {
            consumer.disconnect();
            producer.disconnect();

            done();
          }, 1000);
        }

        return true;
      });
    })
    .then(function (_queue) {
      assert(_queue !== fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue === fixtures.queues[2]);
    });
  });
});

describe('Producer/Consumer msg requeueing:', function () {
  before(function (done) {
    return consumer.connect()
    .then(function (_channel) {
      assert(_channel !== undefined);
      assert(_channel !== null);
    })
    .then(function () {
      return producer.connect();
    })
    .then(function (_channel) {
      assert(_channel !== undefined);
      assert(_channel !== null);
    })
    .then(done);
  });

  it('should be able to consume message, but throw error so the message is requeued again on queue [test-queue-0]', function (done) {
    var attempt = 3;

    consumer.consume(fixtures.queues[0], function (_msg) {
      assert(typeof _msg === 'string');

      --attempt;
      if (!attempt) {
        --letters;
        setTimeout(function () {
          consumer.disconnect();
          producer.disconnect();

          done();
        }, 1000);

        return true;
      }

      throw new Error('Any kind of error');
    })
    .then(function (_queue) {
      assert(_queue === fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    })
    .then(function () {
      return producer.produce(fixtures.queues[0], { msg: uuid.v4() });
    })
    .then(function (_queue) {
      ++letters;
      assert(_queue === fixtures.queues[0]);
      assert(_queue !== fixtures.queues[1]);
      assert(_queue !== fixtures.queues[2]);
    });
  });
});
