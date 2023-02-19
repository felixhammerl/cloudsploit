var expect = require('chai').expect;
var ecs = require('./ecsClusterActiveService');

const createCache = (listData, descData) => {
    return {
        ecs: {
            listClusters: {
                'us-east-1': {
                    err: null,
                    data: listData
                }
            },
            describeCluster: {
                'us-east-1': {
                    'arn:aws:ecs:us-east-1:012345678911:cluster/testCluster': {
                        err: null,
                        data: descData
                    }
                }
            }
        },
    }
};

describe('ECSContainerInsightsEnabled', function () {
    describe('run', function () {
        it('should give passing result if no ECS clusters present', function (done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1)
                expect(results[0].status).to.equal(0)
                expect(results[0].message).to.include('No ECS clusters present')
                done()
            };
            const cache = createCache([], {});
            ecs.run(cache, {}, callback);
        })

        it('should FAIL if ecs cluster does not has active service', function (done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1)
                expect(results[0].status).to.equal(2)
                expect(results[0].message).to.include('ECS cluster does not have active services')
                done()
            };
            const cache = createCache(
                ['arn:aws:ecs:us-east-1:012345678911:cluster/testCluster'],
                {
                  "clusters": [{
                    "name": "mycluster",
                    "activeServicesCount": 0,
                    "arn": "arn:aws:ecs:us-east-1:012345678911:cluster/testCluster",
                    "settings": [{"name": "containerInsights", value: "disabled"}]
                  }]}
                
            );

            ecs.run(cache, {}, callback);
        })
        it('should give Unknown result if unable to query ecs cluster', function (done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1)
                expect(results[0].status).to.equal(3)
                expect(results[0].message).to.include('Unable to query for ECS clusters')
                done()
            };

            const cache = createCache(
                null,
                {
                  "clusters": [{
                    "name": "mycluster",
                    "arn": "arn:aws:ecs:us-east-1:012345678911:cluster/testCluster",
                    "settings": [{"name": "containerInsights", value: "enabled"}]
                  }]}
                
            );
            ecs.run(cache, {}, callback);
        })

        it('should give unknown result if unable to describe the cluster', function (done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(3);
                expect(results[0].message).to.include('Unable to describe ECS cluster');
                done();
        };

            const cache = createCache(
                ['arn:aws:ecs:us-east-1:012345678911:cluster/testCluster'],
                null
                
            );
            ecs.run(cache, {}, callback);
        });

        it('should PASS if ecs cluster has active services', function (done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('ECS cluster have active services');
                done();
            };

          const cache = createCache(
                ['arn:aws:ecs:us-east-1:012345678911:cluster/testCluster'],
                {
                  "clusters": [{
                    "name": "mycluster",
                    "activeServicesCount": 1,
                    "arn": "arn:aws:ecs:us-east-1:012345678911:cluster/testCluster",
                    "settings": [{"name": "containerInsights", value: "enabled"}]
                  }]}
                
            );
            ecs.run(cache, {}, callback);
        });
        
    });
})