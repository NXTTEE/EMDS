/**
 * GGraphs
 * Javascript HTML5 graphs
 *
 * @filesource js/graphs.js
 * @link https://www.kotchasan.com/
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 */
var GGraphs = (function(document) {
  "use strict";
  var GGraphs = function(id, options) {
    this.graphs = $G(id);
    this.graphs.addClass("ggraphs");
    this.options = {
      type: "line",
      rows: 5,
      colors: [
        "#438AEF",
        "#FBB242",
        "#DE4210",
        "#259B24",
        "#E91E63",
        "#1F3D68",
        "#FEE280",
        "#1A9ADC",
        "#C86A4C",
        "#055CDA",
        "#F2D086",
        "#51627F",
        "#F0B7A6",
        "#DE8210",
        "#7791BC"
      ],
      startColor: 0,
      backgroundColor: "auto",
      shadowColor: "rgba(0,0,0,0.3)",
      fontColor: "auto",
      grid: true,
      gridHColor: "#CDCDCD",
      gridVColor: "#CDCDCD",
      showTitle: true,
      lineWidth: 2,
      linePointerSize: 3,
      centerOffset: null,
      centerX: null,
      centerY: null,
      labelOffset: null,
      ringWidth: 30,
      rotate: false,
      strokeColor: null,
      table: "auto"
    };
    for (let property in options) {
      this.options[property] = options[property];
    }
    if (this.options.startColor > 0) {
      let temp = [],
        l = this.options.colors.length,
        i = Math.max(0, Math.min(l - 1, this.options.startColor));
      for (let a = 0; a < l; a++) {
        temp.push(this.options.colors[i]);
        i = i < l - 1 ? i + 1 : 0;
      }
      this.options.colors = temp;
    }
    this.canvas = this.graphs.getElementsByTagName("canvas")[0];
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.graphs.appendChild(this.canvas);
    }
    this.context = this.canvas.getContext("2d");
    this.max = 0;
    this.min = null;
    this.width = 0;
    this.height = 0;
    let self = this,
      canvas = $G(this.canvas),
      hoverItem = null,
      table = null,
      _resize = function() {
        self._draw();
      },
      _mouseMove = function(e) {
        let offset = canvas.viewportOffset(),
          currItem,
          pos = GEvent.pointer(e),
          mouseX = pos.x - offset.left,
          mouseY = pos.y - offset.top;
        if (self.options.type == "pie" || self.options.type == "donut") {
          currItem = self._itemFromPie(mouseX, mouseY);
        } else {
          currItem = self._itemFromRect(mouseX, mouseY);
        }
        if (!currItem) {
          if (hoverItem) {
            canvas.style.cursor = null;
            hoverItem = null;
            canvas.title = '';
          }
        } else if (hoverItem !== currItem) {
          canvas.style.cursor = "pointer";
          hoverItem = currItem;
          canvas.title = currItem;
        }
      };
    if (this.options.table == 'auto') {
      table = this.graphs.getElementsByTagName('table')[0];
    } else if (this.options.table && this.options.table != '') {
      table = document.getElementById(this.options.table);
    }
    if (table) {
      this.setDatas(this._loadFromTable(table));
    }
    window.addEventListener('resize', _resize, true);
    this.canvas.addEvent('mousemove', _mouseMove);
  };

  GGraphs.prototype._itemFromPie = function(mouseX, mouseY) {
    let datas = this.datas,
      currItem = null,
      centerX = this.options.centerX == null ? Math.round(this.width / 2) : this.options.centerX,
      centerY = this.options.centerY == null ? Math.round(this.height / 2) : this.options.centerY,
      radius = centerY - (this.options.centerOffset || (this.height * 0.15)),
      chartStartAngle = -0.5 * Math.PI,
      xFromCenter = mouseX - centerX,
      yFromCenter = mouseY - centerY,
      distanceFromCenter = Math.sqrt(Math.pow(Math.abs(xFromCenter), 2) + Math.pow(Math.abs(yFromCenter), 2)),
      mouseOver = distanceFromCenter <= radius;
    if (this.options.type == "donut") {
      mouseOver &= distanceFromCenter > radius - this.options.ringWidth;
    }
    if (mouseOver) {
      let mouseAngle = Math.atan2(yFromCenter, xFromCenter) - chartStartAngle;
      if (mouseAngle < 0) {
        mouseAngle = 2 * Math.PI + mouseAngle;
      }
      datas.rows[0].items.forEach(function(item) {
        if (mouseAngle >= item.startAngle && mouseAngle <= item.endAngle) {
          if (item.tooltip) {
            currItem = item.tooltip;
          }
          return true;
        }
      });
      return currItem;
    }
  };

  GGraphs.prototype._itemFromRect = function(mouseX, mouseY) {
    let tootip = [];
    this.datas.rows.forEach(function(row) {
      row.items.forEach(function(item) {
        if (
          mouseX >= item.x &&
          mouseX <= item.w &&
          mouseY >= item.y &&
          mouseY <= item.h
        ) {
          if (item.tooltip) {
            tootip.push(item.tooltip);
          }
          return;
        }
      });
    });
    return tootip.length > 0 ? tootip.join("\n") : null;
  };

  GGraphs.prototype._draw = function() {
    let val,
      transparent = /rgba\([0-9a-fA-F,\s]+0\)/,
      changed = false;
    val = this._getFontSize();
    if (val != this.fontSize) {
      this.fontSize = val;
      changed = true;
    }
    val = this.graphs.getStyle("color");
    if (val != this.fontColor) {
      this.fontColor = val;
      changed = true;
    }
    val = this.graphs.getStyle("backgroundColor");
    if (val == "transparent" || transparent.test(val)) {
      val = $G(document.body).getStyle("backgroundColor");
    }
    if (val != this.backgroundColor) {
      this.backgroundColor = val;
      changed = true;
    }
    val = this.canvas.getWidth();
    if (val != this.width) {
      this.width = val;
      changed = true;
    }
    val = this.canvas.getHeight();
    if (val != this.height) {
      this.height = val;
      changed = true;
    }
    if (changed) {
      try {
        if (this.options.type == "line") {
          this._drawLine(false);
        } else if (this.options.type == "spline") {
          this._drawLine(true);
        } else if (this.options.type == "pie") {
          this._drawPie(false);
        } else if (this.options.type == "donut") {
          this._drawPie(true);
        } else if (this.options.type == "hchart") {
          this._drawHChart();
        } else {
          this._drawVChart();
        }
      } catch (err) {}
    }
  };

  GGraphs.prototype.setDatas = function(datas) {
    this.datas = this._reset();
    if (datas.headers.title) {
      this.datas.headers.title = datas.headers.title;
    }
    if (datas.headers.items) {
      this.datas.headers.items = datas.headers.items;
    }
    let self = this,
      headers = this.datas.headers;
    datas.rows.forEach(function(rows) {
      let datas = [],
        d = {},
        max = 0,
        min = null,
        sum = 0;
      if (rows.title) {
        d.title = rows.title;
      }
      rows.items.forEach(function(item, row) {
        sum = sum + item.value;
        max = Math.max(max, item.value);
        min = min == null ? item.value : Math.min(min, item.value);
        if (!item.tooltip) {
          item.tooltip = headers.title + ' ' + headers.items[row] + ' ' + rows.title + ' ' + toCurrency(item.value, null, true);
        }
        datas.push(item);
      });
      d.items = datas;
      d.total = sum;
      d.max = max;
      d.min = min;
      self.datas.rows.push(d);
      self.max = Math.max(max, self.max);
      self.min = self.min == null ? min : Math.min(min, self.min);
    });
    let range = this.max - this.min,
      rowHeight = Math.ceil(range / this.options.rows),
      p = 1;
    while (Math.ceil(rowHeight / p) * p <= rowHeight) {
      p = p * 10;
    }
    if (p < rowHeight) {
      rowHeight = Math.ceil(rowHeight / p) * p;
    }
    this.min = Math.floor(this.min / p) * p;
    if (this.min <= rowHeight || this.min - rowHeight > 0) {
      this.min = Math.max(0, this.min - rowHeight);
      this.max = this.min + (rowHeight * (this.options.rows + 2));
    } else {
      this.max = this.min + (rowHeight * this.options.rows);
    }
    this._draw();
  };

  GGraphs.prototype._loadFromTable = function(table) {
    let datas = this._reset();
    table.querySelectorAll('thead:first-child>tr:first-child>th').forEach(function(item, index) {
      if (index == 0) {
        datas.headers.title = item.innerHTML.strip_tags().replace(/&nbsp;/g, '');
      } else {
        datas.headers.items.push(item.innerHTML.strip_tags());
      }
    });
    table.querySelectorAll('tbody>tr').forEach(function(tr) {
      let rows = [],
        d = {};
      tr.querySelectorAll('td,th').forEach(function(item) {
        let val = {};
        if (item.tagName == 'TH') {
          d.title = item.innerHTML.strip_tags();
        } else {
          if (item.dataset.value) {
            val.value = floatval(item.dataset.value);
          } else {
            val.value = floatval(item.innerHTML.replace(/,/g, ""));
          }
          if (item.dataset.tooltip) {
            val.tooltip = item.dataset.tooltip;
          }
          val.title = item.innerHTML.strip_tags();
          rows.push(val);
        }
      });
      d.items = rows;
      datas.rows.push(d);
    });
    return datas;
  };

  GGraphs.prototype._drawLine = function(spline) {
    this._clear();
    let options = this.options,
      self = this,
      context = this.context,
      headers = this.datas.headers.items,
      offsetRight = Math.ceil(context.measureText(headers[headers.length - 1]).width / 2),
      rowHeight = (this.max - this.min) / options.rows,
      label = this.max,
      l = 0;
    if (options.grid) {
      for (let i = 0; i < options.rows; i++) {
        l = Math.max(l, context.measureText(label).width);
        label = label - rowHeight;
      }
      l = l + 15;
    } else {
      l = options.linePointerSize;
    }
    let t = Math.ceil(this.fontSize / 2),
      r = this.width - offsetRight - 5,
      b = this.height - this.fontSize - (options.labelOffset || 5),
      rows = options.rows,
      cols = Math.max(2, headers.length),
      cellWidth = Math.floor((r - l) / (cols - 1)),
      cellHeight = Math.floor((b - t) / rows);
    r = cellWidth * (cols - 1) + l;
    b = cellHeight * rows + t;
    let clientHeight = b - t,
      o = options.lineWidth + 2;
    this.datas.rows.forEach(function(row) {
      row.items.forEach(function(item, index) {
        item.cx = index * cellWidth + l;
        item.cy = clientHeight + t - Math.floor((clientHeight * (item.value - self.min)) / (self.max - self.min));
        item.x = item.cx - o;
        item.y = item.cy - o;
        item.w = item.cx + o;
        item.h = item.cy + o;
      });
    });

    function drawGraph() {
      if (options.grid) {
        let y = t,
          x = l,
          label = self.max;
        context.lineWidth = 1;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = self.fontColor;
        for (let i = 0; i <= rows; i++) {
          context.fillText(toCurrency(label, null, true), l - 10, y);
          if (options.gridVColor && i > 0 && i < rows) {
            context.strokeStyle = options.gridVColor;
            context.beginPath();
            context.moveTo(l, y);
            context.lineTo(r, y);
            context.stroke();
            context.closePath();
          }
          y = y + cellHeight;
          label = label - rowHeight;
        }
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = self.fontColor;
        headers.forEach(function(item, index) {
          if (options.gridHColor && index > 0 && index < cols - 1) {
            context.strokeStyle = options.gridHColor;
            context.beginPath();
            context.moveTo(x, t);
            context.lineTo(x, b);
            context.stroke();
            context.closePath();
          }
          if (options.rotate) {
            let metric = context.measureText(item),
              y = self.height - metric.width + 35,
              xx = x + self.fontSize / 2;
            context.save();
            context.translate(xx, y);
            context.rotate(-Math.PI / 2);
            context.translate(-xx, -y);
            context.fillText(item, xx, y);
            context.restore();
          } else {
            context.fillText(item, x, self.height);
          }
          x = x + cellWidth;
        });
        context.strokeStyle = self.fontColor;
        context.beginPath();
        context.moveTo(l, t);
        context.lineTo(r, t);
        context.lineTo(r, b);
        context.lineTo(l, b);
        context.lineTo(l, t);
        context.stroke();
        context.closePath();
      }
      var xp, yp, len;
      if (spline) {
        var line = new Spline(self.canvas, {
          minWidth: options.lineWidth / 2,
          maxWidth: options.lineWidth / 2
        });
      }
      context.lineWidth = Math.max(1, options.lineWidth);
      self.datas.rows.forEach(function(rows, row) {
        if (spline) {
          line.penColor = options.colors[row % options.colors.length];
          line.reset();
          len = rows.items.length;
        }
        rows.items.forEach(function(item, index) {
          if (spline) {
            line.add(item.cx, item.cy);
            if (index == len - 1) {
              line.add(xp, yp);
            }
          } else if (index > 0) {
            context.strokeStyle = options.colors[row % options.colors.length];
            context.beginPath();
            context.moveTo(xp, yp);
            context.lineTo(item.cx, item.cy);
            context.stroke();
            context.closePath();
          }
          xp = item.cx;
          yp = item.cy;
        });
        if (options.linePointerSize > 0) {
          forEach(rows.items, function() {
            context.fillStyle = options.colors[row % options.colors.length];
            context.beginPath();
            context.arc(this.cx, this.cy, options.linePointerSize, 0, Math.PI * 2, true);
            context.fill();
          });
        }
      });
      self._displayTitle(self.datas.rows);
    }

    drawGraph();
  };

  GGraphs.prototype._drawPie = function(donut) {
    this._clear();
    let options = this.options,
      self = this,
      context = this.context,
      centerX = options.centerX == null ? Math.round(this.width / 2) : options.centerX,
      centerY = options.centerY == null ? Math.round(this.height / 2) : options.centerY,
      radius = centerY - (options.centerOffset || (this.height * 0.15)),
      counter = 0.0,
      chartStartAngle = -0.5 * Math.PI,
      sum = this.datas.rows[0].total,
      labelOffset = options.labelOffset || (this.height * 0.15);
    forEach(this.datas.rows[0].items, function(item, index) {
      let fraction = item.value / sum;
      item.startAngle = counter * Math.PI * 2;
      item.endAngle = (counter + fraction) * Math.PI * 2;
      item.midAngle = counter + fraction / 2;
      item.percentage = Math.round(fraction * 100);
      counter += fraction;
    });

    function drawSlice(slice, index) {
      if (slice.percentage) {
        let distance = (radius / 2.5) * (Math.pow(1 - 2.5 / radius, 0.8) + 1) + labelOffset,
          labelX = Math.round(centerX + Math.sin(slice.midAngle * Math.PI * 2) * distance),
          labelY = Math.round(centerY - Math.cos(slice.midAngle * Math.PI * 2) * distance),
          c = options.colors[index % options.colors.length];
        context.strokeStyle = c;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(labelX, labelY);
        if (labelX < centerX) {
          context.lineTo(labelX - 5, labelY);
          context.textAlign = "right";
          labelX -= 10;
        } else {
          context.lineTo(labelX + 5, labelY);
          context.textAlign = "left";
          labelX += 10;
        }
        context.textBaseline = "middle";
        context.stroke();
        context.closePath();
        context.fillStyle = c;
        let text = toCurrency(slice.value, null, true);
        if (options.strokeColor) {
          context.strokeStyle = options.strokeColor;
          context.strokeText(text, labelX, labelY);
        }
        context.fillText(text, labelX, labelY);
      }
      let startAngle = slice.startAngle + chartStartAngle,
        endAngle = slice.endAngle + chartStartAngle;
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, startAngle, endAngle, false);
      context.lineTo(centerX, centerY);
      context.closePath();
      context.fillStyle = options.colors[index % options.colors.length];
      context.fill();
      context.lineWidth = 0;
      context.strokeStyle = self.backgroundColor;
      context.stroke();
    }

    function drawGraph() {
      context.save();
      context.fillStyle = self.backgroundColor;
      context.beginPath();
      context.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, false);
      context.fill();
      context.restore();
      self.datas.rows[0].items.forEach(function(item, index) {
        drawSlice(item, index);
      });
      if (donut) {
        context.fillStyle = self.backgroundColor;
        context.beginPath();
        context.arc(centerX, centerY, radius - options.ringWidth, 0, Math.PI * 2, false);
        context.fill();
        context.restore();
      }
      self._displayTitle(self.datas.headers.items);
    }
    drawGraph();
  };

  GGraphs.prototype._drawHChart = function() {
    this._clear();
    let options = this.options,
      self = this,
      context = this.context,
      headers = this.datas.headers.items,
      data_rows = this.datas.rows,
      offsetRight = Math.ceil(context.measureText(toCurrency(this.max, null, true)).width / 2),
      l = 0;
    headers.forEach(function(item) {
      l = Math.max(l, self.context.measureText(item).width);
    });
    l = l + 10;
    let t = Math.ceil(this.fontSize / 2),
      r = this.width - offsetRight,
      b = this.height - this.fontSize - (options.labelOffset || 5),
      cols = options.rows,
      rows = Math.max(2, headers.length),
      cellWidth = Math.floor((r - l) / cols),
      cellHeight = Math.floor((b - t) / rows);
    r = cellWidth * cols + l;
    b = cellHeight * rows + t;
    let clientWidth = r - l,
      barHeight = Math.max(2, (cellHeight - 8 - 2 * (data_rows.length + 1)) / data_rows.length),
      offsetHeight = t + 6;
    data_rows.forEach(function(row) {
      row.items.forEach(function(item, index) {
        item.x = l;
        item.y = index * cellHeight + offsetHeight;
        item.cw = Math.max(3, Math.floor((clientWidth * item.value) / self.max));
        item.ch = barHeight;
        item.w = item.x + item.cw;
        item.h = item.y + barHeight;
      });
      offsetHeight = offsetHeight + barHeight + 2;
    });

    function drawGraph() {
      if (options.grid) {
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = self.fontColor;
        let y = t,
          offset = cellHeight / 2;
        headers.forEach(function(item, index) {
          context.fillText(item, 0, y + offset);
          if (options.gridVColor && index > 0 && index < rows) {
            context.strokeStyle = options.gridVColor;
            context.beginPath();
            context.moveTo(l, y);
            context.lineTo(r, y);
            context.stroke();
            context.closePath();
          }
          y = y + cellHeight;
        });
        let label = 0,
          labelValue = self.max / cols,
          x = l;
        if (labelValue > 1) {
          labelValue = Math.floor(labelValue);
        }
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = self.fontColor;
        for (let i = 0; i <= cols; i++) {
          if (options.rotate) {
            let metric = context.measureText(label),
              y = self.height - metric.width,
              xx = x + self.fontSize / 2;
            context.save();
            context.translate(xx, y);
            context.rotate(-Math.PI / 2);
            context.translate(-xx, -y);
            context.fillText(toCurrency(label, null, true), xx, y);
            context.restore();
          } else {
            context.fillText(toCurrency(label, null, true), x, self.height);
          }
          if (options.gridHColor && i > 0 && i < cols) {
            context.strokeStyle = options.gridHColor;
            context.beginPath();
            context.moveTo(x, t);
            context.lineTo(x, b);
            context.stroke();
            context.closePath();
          }
          x = x + cellWidth;
          label = label + labelValue;
        }
        context.strokeStyle = self.fontColor;
        context.beginPath();
        context.moveTo(l, t);
        context.lineTo(r, t);
        context.lineTo(r, b);
        context.lineTo(l, b);
        context.lineTo(l, t);
        context.stroke();
        context.closePath();
      }
      let sw = barHeight < 10 ? 1 : 3,
        dl = data_rows.length;
      data_rows.forEach(function(rows, row) {
        rows.items.forEach(function(item, index) {
          if (item.cw > sw && item.value > 0) {
            context.fillStyle = options.shadowColor;
            context.fillRect(item.x, item.y, item.cw - sw, item.ch);
          }
          context.fillStyle = options.colors[(dl > 1 ? row : index) % options.colors.length];
          context.fillRect(item.x + 1, item.y, item.cw, item.ch - sw);
        });
      });
      self._displayTitle(data_rows);
    }
    drawGraph();
  };

  GGraphs.prototype._drawVChart = function() {
    this._clear();
    let options = this.options,
      self = this,
      context = this.context,
      headers = this.datas.headers.items,
      offsetRight = Math.ceil(context.measureText(headers[headers.length - 1]).width / 2),
      label = this.max,
      l = 0,
      labelValue = this.max / options.rows;
    if (labelValue > 1) {
      labelValue = Math.floor(labelValue);
    }
    for (let i = 0; i < options.rows; i++) {
      l = Math.max(l, context.measureText(label).width);
      label = label - labelValue;
    }
    l = l + 15;
    let t = Math.ceil(this.fontSize / 2),
      r = this.width - offsetRight,
      b = this.height - this.fontSize - (options.labelOffset || 5),
      cols = Math.max(2, headers.length),
      cellWidth = (r - l) / cols,
      cellHeight = (b - t) / options.rows,
      offsetWidth = l + 6,
      barWidth = Math.max(2, (cellWidth - 6 * (this.datas.rows.length + 1)) / this.datas.rows.length),
      clientHeight = cellHeight * options.rows;
    this.datas.rows.forEach(function(row) {
      row.items.forEach(function(item, index) {
        item.x = index * cellWidth + offsetWidth;
        item.y = clientHeight - ((clientHeight * item.value) / self.max) + t;
        item.ch = b - item.y;
        item.cw = barWidth;
        item.w = item.x + item.cw;
        item.h = b;
        if (item.ch < 3) {
          item.y = b - 3;
          item.ch = 3;
        }
      });
      offsetWidth = offsetWidth + barWidth + 2;
    });

    function drawGraph() {
      if (options.grid) {
        let y = t;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = self.fontColor;
        let label = self.max,
          labelValue = self.max / options.rows;
        if (labelValue > 1) {
          labelValue = Math.floor(labelValue);
        }
        for (let i = 0; i <= options.rows; i++) {
          context.fillText(toCurrency(label, null, true), l - 5, y);
          if (options.gridVColor && i > 0 && i < options.rows) {
            context.strokeStyle = options.gridVColor;
            context.beginPath();
            context.moveTo(l, y);
            context.lineTo(r, y);
            context.stroke();
            context.closePath();
          }
          y = y + cellHeight;
          label = label - labelValue;
        }
        let x = l,
          offset = cellWidth / 2;
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = self.fontColor;
        headers.forEach(function(item, index) {
          if (index < cols) {
            if (options.rotate) {
              let metric = context.measureText(item),
                y = self.height - metric.width + 35,
                xx = x + offset + (self.fontSize / 2);
              context.save();
              context.translate(xx, y);
              context.rotate(-Math.PI / 2);
              context.translate(-xx, -y);
              context.fillText(item, xx, y);
              context.restore();
            } else {
              context.fillText(item, x + offset, self.height);
            }
          }
          if (options.gridHColor && index > 0 && index < cols) {
            context.strokeStyle = options.gridHColor;
            context.beginPath();
            context.moveTo(x, t);
            context.lineTo(x, b);
            context.stroke();
            context.closePath();
          }
          x = x + cellWidth;
        });
        context.strokeStyle = self.fontColor;
        context.beginPath();
        context.moveTo(l, t);
        context.lineTo(r, t);
        context.lineTo(r, b);
        context.lineTo(l, b);
        context.lineTo(l, t);
        context.stroke();
        context.closePath();
      }
      let sw = barWidth < 10 ? 1 : 3,
        dl = self.datas.rows.length;
      self.datas.rows.forEach(function(rows, row) {
        rows.items.forEach(function(item, index) {
          if (item.ch > sw && item.value > 0) {
            context.fillStyle = options.shadowColor;
            context.fillRect(item.x, item.y + sw, item.cw, item.ch - sw);
          }
          context.fillStyle = options.colors[(dl > 1 ? row : index) % options.colors.length];
          context.fillRect(item.x, item.y, item.cw - sw, item.ch - 1);
        });
      });
      self._displayTitle(self.datas.rows);
    }
    drawGraph();
  };

  GGraphs.prototype._reset = function() {
    return {
      headers: {
        title: '',
        items: []
      },
      rows: []
    };
  };

  GGraphs.prototype._clear = function() {
    this.canvas.set("width", this.width);
    this.canvas.set("height", this.height);
    this.context.font = this.fontSize + "px " + this.graphs.getStyle("fontFamily");
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.width, this.height);
  };

  GGraphs.prototype._getFontSize = function() {
    let div = document.createElement("div"),
      atts = {
        fontSize: "1em",
        padding: "0",
        position: "absolute",
        lineHeight: "1",
        visibility: "hidden"
      };
    for (let p in atts) {
      div.style[p] = atts[p];
    }
    div.appendChild(document.createTextNode("M"));
    this.graphs.appendChild(div);
    let h = div.offsetHeight;
    this.graphs.removeChild(div);
    return h;
  };

  GGraphs.prototype._displayTitle = function(headers) {
    if (this.options.showTitle) {
      let label,
        div,
        span,
        self = this,
        graph = this.canvas.parentNode,
        lbs = graph.getElementsByClassName('bottom_label');
      if (lbs.length == 0) {
        div = document.createElement('div');
        graph.insertBefore(div, this.canvas.nextSibling);
        div.className = 'bottom_label';
      } else {
        div = lbs[0];
        div.innerHTML = '';
      }
      headers.forEach(function(item, index) {
        if (item.title || typeof item == 'string') {
          label = document.createElement('div');
          span = document.createElement('span');
          span.style.backgroundColor = self.options.colors[index % self.options.colors.length];
          label.appendChild(span);
          span = document.createElement('span');
          span.innerHTML = item.title ? item.title : item;
          label.appendChild(span);
          div.appendChild(label);
        }
      });
    }
  };

  return GGraphs;
})(document);
