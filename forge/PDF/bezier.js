

var TessParams = {
  //How many forward iterations to use when approximating Bezier curves
  //More iterations are needed in case the min_seg_len setting below is smaller
  //relative to mesh size. However, the two numbers need to be tuned together
  //so that NUM_ITERATIONS is enough to result in segment lengths desired.

  //Note that those values are tuned for PDF rendering, where text characters
  //are drawn one by one. If a long piece of text is drawn all at once, then
  //its bounding box will be quite large, so the relative min_seg_len will also
  //be too large and the characters will look coarse. In such cases, we will need
  //to better estimate this by using e.g. the font height only.
  numIterations: 100,

  //What fraction of the bounding sbox should be the minimum length of
  //a segment
  minSegLenFraction: 0.05 };


export function SetTesselationParams(num_iterations, min_seg_len_fraction) {
  if (num_iterations)
  TessParams.numIterations = num_iterations;

  if (min_seg_len_fraction)
  TessParams.minSegLenFraction = min_seg_len_fraction;
}


export function TesselateCubic(ctx, px1, py1, px2, py2, px3, py3, px4, py4, maxdim, tessParams)
{
  tessParams = tessParams || TessParams;

  //we will base the max number of segments to use for approximation
  //on the bounds of the full line buffer contents
  //TODO: as an improvement we could take the bounds of this particular curve
  //with respect to the full bounds of the line buffer data.
  maxdim = maxdim || 1 / tessParams.minSegLenFraction;

  //minimum length of tesselation segment
  //set to 1/100 of the bounds
  var minSegLen = maxdim * tessParams.minSegLenFraction;

  //but for now we will iterate 100 times
  var dt = 1.0 / tessParams.numIterations;

  //double dt2 = dt*dt;
  var dt3 = dt * dt * dt;

  var pre1 = 3.0 * dt;
  var pre2 = pre1 * dt;
  var pre3 = pre2 + pre2;
  var pre4 = 6.0 * dt3;

  var temp1x = px1 - 2.0 * px2 + px3;
  var temp1y = py1 - 2.0 * py2 + py3;
  var temp2x = 3.0 * (px2 - px3) - px1 + px4;
  var temp2y = 3.0 * (py2 - py3) - py1 + py4;

  var fx = px1;
  var fy = py1;
  var dfx = (px2 - px1) * pre1 + temp1x * pre2 + temp2x * dt3;
  var dfy = (py2 - py1) * pre1 + temp1y * pre2 + temp2y * dt3;
  var ddfx = temp1x * pre3 + temp2x * pre4;
  var ddfy = temp1y * pre3 + temp2y * pre4;
  var dddfx = temp2x * pre4;
  var dddfy = temp2y * pre4;

  var error = 0.0;

  // forward differencing loop
  var tMax = 0 | 1.0 / dt - 0.5;
  for (var t = 0; t < tMax; t++)
  {
    fx += dfx;
    fy += dfy;
    dfx += ddfx;
    dfy += ddfy;
    ddfy += dddfy;
    ddfx += dddfx;

    error += Math.sqrt(dfx * dfx + dfy * dfy);

    if (error >= minSegLen) //add segment only if we have reached treshold length
      {
        // line to current
        ctx.lineTo(fx, fy);
        error = 0.0;
      }
  }

  ctx.lineTo(px4, py4);
}

export function TesselateQuad(ctx, px1, py1, px2, py2, px3, py3, maxdim, tessParams)
{
  tessParams = tessParams || TessParams;

  //we will base the max number of segments to use for approximation
  //on the bounds of the full line buffer contents
  //TODO: as an improvement we could take the bounds of this particular curve
  //with respect to the full bounds of the line buffer data.
  maxdim = maxdim || 1 / tessParams.minSegLenFraction;

  //minimum length of tesselation segment
  //set to a fraction of the bbox of the entire path (value chosen to work well for text at reasonable font size)
  var minSegLen = maxdim * tessParams.minSegLenFraction;

  //but for now we will iterate 100 times
  var dt = 1.0 / tessParams.numIterations;

  var dt2 = dt * dt;

  var ax = px1 - 2.0 * px2 + px3; //replace 2* by addition?
  var ay = py1 - 2.0 * py2 + py3; //replace 2* by addition?

  var bx = 2.0 * (px2 - px1);
  var by = 2.0 * (py2 - py1);

  var fx = px1;
  var fy = py1;
  var dfx = bx * dt + ax * dt2;
  var dfy = by * dt + ay * dt2;
  var ddfx = 2.0 * ax * dt2;
  var ddfy = 2.0 * ay * dt2;

  var error = 0.0;

  //forward differencing loop
  var tMax = 0 | 1.0 / dt - 0.5;
  for (var t = 0; t < tMax; t++)
  {
    fx += dfx;
    fy += dfy;
    dfx += ddfx;
    dfy += ddfy;

    error += Math.sqrt(dfx * dfx + dfy * dfy);

    if (error >= minSegLen) // how many pixels should each line be?)
      {
        ctx.lineTo(fx, fy);
        error = 0.0;
      }
  }

  ctx.lineTo(px3, py3);
}