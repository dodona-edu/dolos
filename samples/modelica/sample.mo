package simpleElectricCircuit

import Modelica.SIunits.*; 
//Voltage and Current are types defined in SIunits package of Modelica. These types are used frequently in this package //

connector pin
  Voltage v;
  flow Current i;
  annotation(Icon(coordinateSystem(extent = {{-100, 100}, {100, -100}}, grid = {2, 2}), graphics = {Rectangle(extent = {{-100, 100}, {100, -100}}, lineColor = {0, 0, 255}, fillColor = {0, 0, 255}, fillPattern = FillPattern.Solid)}));
end pin;

class Ground
  simpleElectricCircuit.pin p annotation(Placement(visible = true, transformation(origin = {2, 0}, extent = {{-10, -10}, {10, 10}}, rotation = 0), iconTransformation(origin = {0, -8}, extent = {{-10, -10}, {10, 10}}, rotation = 0)));
  equation
    p.v = 0;
    annotation(Icon(coordinateSystem(initialScale = 0.1), graphics = {Line(origin = {0, 12}, points = {{0, -10}, {0, 10}, {0, 10}})}));
  end Ground;

class Resistor
    pin p annotation(Placement(transformation(extent = {{-110, 10}, {-90, -10}})));
    pin n annotation(Placement(transformation(extent = {{90, 10}, {110, -10}})));
    Voltage Vr; // Voltage across Resistor //
    Current Ir; // Current through Resistor //
    parameter Real R = 5;
equation
    Vr = p.v - n.v;
    p.i + n.i = 0;
    Ir = p.i;
    Vr = R * Ir;
end Resistor;

class VoltageSource
    pin p annotation(Placement(transformation(extent = {{-110, 10}, {-90, -10}})));
    pin n annotation(Placement(transformation(extent = {{90, 10}, {110, -10}})));
    Voltage Vs;
    Current Is;
    parameter Voltage Vo = 10 "Amplitude";
    parameter Real f(unit = "Hz") = 1"frequency";
    constant Real PI = 3.14;
equation
    Vs = p.v - n.v;
    p.i + n.i = 0;
    Is = p.i;    
    Vs = Vo*sin(2*PI*f*time);
    annotation(Icon(coordinateSystem(extent = {{-100, 100}, {100, -100}}, grid = {2, 2}), graphics = {Line(origin = {0, 0}, points = {{-90, 0}, {-20, 0}}, color = {0, 0, 255}), Ellipse(origin = {0, 0}, extent = {{-20, 20}, {20, -20}}, lineColor = {255, 0, 0}), Line(origin = {0, 0}, points = {{20, 0}, {90, 0}}, color = {0, 0, 255}), Text(origin = {0, 0}, extent = {{-20, 60}, {20, 40}}, textString = "Vo = %Vo")}));
end VoltageSource;

  class circuit
  simpleElectricCircuit.VoltageSource voltageSource1 annotation(Placement(visible = true, transformation(origin = {6, 38}, extent = {{-26, -26}, {26, 26}}, rotation = 0)));
    simpleElectricCircuit.Resistor resistor1 annotation(Placement(visible = true, transformation(origin = {0, -32}, extent = {{-12, -12}, {12, 12}}, rotation = 0)));
  simpleElectricCircuit.Ground ground1 annotation(Placement(visible = true, transformation(origin = {45, -59}, extent = {{-17, -17}, {17, 17}}, rotation = 0)));
  equation
    connect(voltageSource1.p, resistor1.p) annotation(Line(points = {{-20, 38}, {-70, 38}, {-70, -32}, {-12, -32}}, color = {0, 0, 255}));
    connect(voltageSource1.n, resistor1.n) annotation(Line(points = {{32, 38}, {70, 38}, {70, -34}, {12, -34}, {12, -32}}, color = {0, 0, 255}));
    connect(ground1.p, voltageSource1.n) annotation(Line(points = {{44, -60}, {46, -60}, {46, 38}, {32, 38}}, color = {0, 0, 255}));
    connect(ground1.p, resistor1.n) annotation(Line(points = {{44, -60}, {12, -60}, {12, -32}, {12, -32}}, color = {0, 0, 255}));
  end circuit;
end simpleElectricCircuit;