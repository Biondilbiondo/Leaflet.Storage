describe('L.Storage.Polygon', function () {
    var p2ll, map;

    before(function () {
        this.map = map = initMap({storage_id: 99});
        enableEdit();
        p2ll = function (x, y) {
            return map.containerPointToLatLng([x, y]);
        };
        this.datalayer = this.map.createDataLayer();
        this.datalayer.connectToMap();;
    });

    after(function () {
        clickCancel();
        resetMap();
    });

    afterEach(function () {
        this.datalayer.empty();
    });

    describe('#isMulti()', function () {

        it('should return false for basic Polygon', function () {
            var layer = new L.S.Polygon(this.map, [[1, 2], [3, 4], [5, 6]], {datalayer: this.datalayer});
            assert.notOk(layer.isMulti())
        });

        it('should return false for nested basic Polygon', function () {
            var latlngs = [
                    [[p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)]]
                ],
                layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer});
            assert.notOk(layer.isMulti())
        });

        it('should return false for simple Polygon with hole', function () {
            var layer = new L.S.Polygon(this.map, [[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10], [11, 12]]], {datalayer: this.datalayer});
            assert.notOk(layer.isMulti())
        });

        it('should return true for multi Polygon', function () {
            var latLngs = [
                [
                    [[1, 2], [3, 4], [5, 6]]
                ],
                [
                    [[7, 8], [9, 10], [11, 12]]
                ]
            ];
            var layer = new L.S.Polygon(this.map, latLngs, {datalayer: this.datalayer});
            assert.ok(layer.isMulti())
        });

        it('should return true for multi Polygon with hole', function () {
            var latLngs = [
               [[[10, 20], [30, 40], [50, 60]]],
               [[[0, 10], [10, 10], [10, 0]], [[2, 3], [2, 4], [3, 4]]]
            ];
            var layer = new L.S.Polygon(this.map, latLngs, {datalayer: this.datalayer});
            assert.ok(layer.isMulti())
        });

    });

    describe('#contextmenu', function () {

        afterEach(function () {
            // Make sure contextmenu is hidden
            happen.once(document, {type: 'keydown', keyCode: 27});
        });

        describe('#in edit mode', function () {

            it('should allow to remove shape when multi', function () {
                var latlngs = [
                        [[p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)]],
                        [[p2ll(300, 350), p2ll(350, 400), p2ll(400, 300)]]
                    ],
                    layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'});
                assert.equal(qst('Remove shape from the multi'), 1);
            });

            it('should not allow to remove shape when not multi', function () {
                var latlngs = [
                        [[p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)]]
                    ],
                    layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'});
                assert.notOk(qst('Remove shape from the multi'));
            });

            it('should not allow to transform to lines when multi', function () {
                var latlngs = [
                        [[p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)]],
                        [[p2ll(300, 350), p2ll(350, 400), p2ll(400, 300)]]
                    ],
                    layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'});
                assert.notOk(qst('Transform to lines'));
            });

            it('should not allow to transform to lines when hole', function () {
                var latlngs = [
                        [
                            [p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)],
                            [p2ll(120, 150), p2ll(150, 180), p2ll(180, 120)]
                        ]
                    ],
                    layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'});
                assert.notOk(qst('Transform to lines'));
            });

            it('should allow to transform to lines when not multi', function () {
                var latlngs = [
                        [[p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)]]
                    ],
                    layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.at('contextmenu', 150, 150);
                assert.equal(qst('Transform to lines'), 1);
            });

            it('should not allow to transfer shape when not editedFeature', function () {
                var layer = new L.S.Polygon(this.map, [p2ll(100, 150), p2ll(100, 200), p2ll(200, 150)], {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.at('contextmenu', 110, 160);
                assert.equal(qst('Delete this feature'), 1);  // Make sure we have right clicked on the polygon.
                assert.notOk(qst('Transfer shape to edited feature'));
            });

            it('should not allow to transfer shape when editedFeature is not a polygon', function () {
                var layer = new L.S.Polygon(this.map, [p2ll(100, 150), p2ll(100, 200), p2ll(200, 150)], {datalayer: this.datalayer}).addTo(this.datalayer),
                    other = new L.S.Polyline(this.map, [p2ll(200, 250), p2ll(200, 300)], {datalayer: this.datalayer}).addTo(this.datalayer);
                other.edit();
                happen.at('contextmenu', 110, 160);
                assert.equal(qst('Delete this feature'), 1);  // Make sure we have right clicked on the polygon.
                assert.notOk(qst('Transfer shape to edited feature'));
            });

            it('should allow to transfer shape when another polygon is edited', function (done) {
                var other = new L.S.Polygon(this.map, [p2ll(200, 300), p2ll(300, 200), p2ll(200, 100)], {datalayer: this.datalayer}).addTo(this.datalayer);
                other.edit();  // This moves the map to put "other" at the center.
                this.map.once('moveend', function () {
                    var layer = new L.S.Polygon(this.map, [p2ll(100, 150), p2ll(100, 200), p2ll(200, 150)], {datalayer: this.datalayer}).addTo(this.datalayer);
                    happen.at('contextmenu', 110, 160);
                    assert.equal(qst('Transfer shape to edited feature'), 1);
                    done();
                }, this);
            });

        });

    });

    describe('#addShape', function () {

        it('"add shape" control should not be visible by default', function () {
            assert.notOk(qs('.storage-draw-polygon-multi'));
        });

        it('"add shape" control should be visible when editing a Polygon', function () {
            var layer = new L.S.Polygon(this.map, [p2ll(100, 100), p2ll(100, 200)], {datalayer: this.datalayer}).addTo(this.datalayer);
            layer.edit();
            assert.ok(qs('.storage-draw-polygon-multi'));
        });

        it('"add shape" control should extend the same multi', function () {
            var layer = new L.S.Polygon(this.map, [p2ll(100, 150), p2ll(150, 200), p2ll(200, 100)], {datalayer: this.datalayer}).addTo(this.datalayer);
            layer.edit();
            assert.notOk(layer.isMulti());
            happen.click(qs('.storage-draw-polygon-multi'));
            happen.at('mousemove', 300, 300);
            happen.at('click', 300, 300);
            happen.at('mousemove', 350, 300);
            happen.at('click', 350, 300);
            happen.at('click', 350, 300);
            assert.ok(layer.isMulti());
            assert.equal(this.datalayer._index.length, 1);
        });

    });

    describe('#transferShape', function () {

        it('should transfer simple polygon shape to another polygon', function () {
            var latlngs = [p2ll(100, 150), p2ll(100, 200), p2ll(200, 100)],
                layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer),
                other = new L.S.Polygon(this.map, [p2ll(200, 350), p2ll(200, 300), p2ll(300, 200)], {datalayer: this.datalayer}).addTo(this.datalayer);
            assert.ok(this.map.hasLayer(layer));
            layer.transferShape(p2ll(150, 150), other);
            assert.equal(other._latlngs.length, 2);
            assert.deepEqual(other._latlngs[1][0], latlngs);
            assert.notOk(this.map.hasLayer(layer));
        });

        it('should transfer multipolygon shape to another polygon', function () {
            var latlngs = [
                    [
                        [p2ll(100, 150), p2ll(100, 200), p2ll(200, 100)],
                        [p2ll(120, 150), p2ll(150, 180), p2ll(180, 120)]
                    ],
                    [[p2ll(200, 300), p2ll(300, 200)]]
                ],
                layer = new L.S.Polygon(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer),
                other = new L.S.Polygon(this.map, [p2ll(200, 350), p2ll(200, 300), p2ll(300, 200)], {datalayer: this.datalayer}).addTo(this.datalayer);
            assert.ok(this.map.hasLayer(layer));
            layer.transferShape(p2ll(150, 150), other);
            assert.equal(other._latlngs.length, 2);
            assert.deepEqual(other._latlngs[1][0], latlngs[0][0]);
            assert.ok(this.map.hasLayer(layer));
            assert.equal(layer._latlngs.length, 1);
        });

    });

});