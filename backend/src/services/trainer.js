import * as tf from '@tensorflow/tfjs-node';
import { encodeCat, encodeProduct, getVectorDimention } from './encoder.js';

/**
 * Pares (gato, produto) com rótulo binário (comprou / não comprou).
 */
export function createTrainingData(context) {
  const inputs = [];
  const labels = [];

  context.cats
    .filter((c) => c.purchases?.length)
    .forEach((cat) => {
      const catVec = encodeCat(cat, context).dataSync();
      context.products.forEach((product) => {
        const productVec = encodeProduct(product, context).dataSync();
        const label = cat.purchases.some((p) => p.name === product.name) ? 1 : 0;
        inputs.push([...catVec, ...productVec]);
        labels.push(label);
      });
    });

  if (inputs.length === 0) {
    throw new Error('Nenhum dado de treino: adicione gatos com compras simuladas no seed.');
  }

  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimention: getVectorDimention(context),
  };
}

export async function configureNeuralNetAndTrain(trainData, epochCallback) {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimention],
      units: 128,
      activation: 'relu',
    })
  );
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: epochCallback
      ? {
          onEpochEnd: (epoch, logs) => {
            epochCallback(epoch, logs);
          },
        }
      : undefined,
  });

  return model;
}

export async function disposeTrainingTensors(trainData) {
  trainData.xs.dispose();
  trainData.ys.dispose();
}
